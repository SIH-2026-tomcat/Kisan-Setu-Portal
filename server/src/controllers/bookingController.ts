import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logSimulatedSMS } from '../utils/smsLogger';
import { toKilograms, formatQuantityFromKg } from '../utils/quantityUtils';

/**
 * Create a new Procurement Slot Booking (Concurrency-Safe Transaction)
 */
export async function createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const farmerId = req.user?.id;
    if (!farmerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { centreId, slotId, cropType, expectedQuantity, quantityUnit } = req.body;
    const quantity = parseFloat(expectedQuantity);

    if (isNaN(quantity) || quantity <= 0) {
      res.status(400).json({ success: false, message: 'Expected quantity must be a positive number greater than 0.' });
      return;
    }

    const unit = (quantityUnit || 'q').toLowerCase().trim();
    if (!['kg', 'q'].includes(unit)) {
      res.status(400).json({ success: false, message: 'Invalid quantity unit. Select Kilograms (kg) or Quintals (q).' });
      return;
    }

    const expectedQuantityKg = toKilograms(quantity, unit);
    const expectedQuantityQ = Math.round((expectedQuantityKg / 100) * 100) / 100;

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer account not found.' });
      return;
    }

    // Execute concurrency-safe Prisma transaction
    const bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch and Lock/Re-check slot capacity inside transaction
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: { centre: true },
      });

      if (!slot) {
        throw new Error('SLOT_NOT_FOUND');
      }

      if (slot.centreId !== centreId) {
        throw new Error('CENTRE_MISMATCH');
      }

      // Strict capacity check to prevent overbooking on concurrent requests
      if (slot.bookedCount >= slot.capacity) {
        throw new Error('SLOT_FULL');
      }

      // 2. Check for duplicate active booking for the same farmer on the same slot date
      const existingBooking = await tx.booking.findFirst({
        where: {
          farmerId,
          slot: {
            date: slot.date,
          },
          status: { in: ['BOOKED', 'ARRIVED', 'INSPECTED'] },
        },
      });

      if (existingBooking) {
        throw new Error('DUPLICATE_BOOKING_DATE');
      }

      // 3. Generate unique booking reference and token number
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingReference = `KS-26032-${randomSuffix}`;
      
      // Calculate token based on slot sequence & existing bookings for centre today
      const totalBookingsToday = await tx.booking.count({
        where: {
          centreId,
          slot: { date: slot.date },
        },
      });
      const tokenNumber = `A-${String(totalBookingsToday + 1).padStart(3, '0')}`;

      // 4. Increment bookedCount on the Slot inside transaction
      await tx.slot.update({
        where: { id: slot.id },
        data: {
          bookedCount: {
            increment: 1,
          },
        },
      });

      // 5. Create the Booking record
      const dualFormatted = formatQuantityFromKg(expectedQuantityKg, unit).dualDisplay;

      const booking = await tx.booking.create({
        data: {
          farmerId,
          centreId,
          slotId,
          bookingReference,
          tokenNumber,
          cropType,
          expectedQuantity: expectedQuantityQ,
          quantityUnit: unit,
          originalQuantity: quantity,
          expectedQuantityKg,
          status: 'BOOKED',
        },
        include: {
          centre: true,
          slot: true,
          farmer: true,
        },
      });

      // 6. Automatically initialize Procurement record in PENDING_INSPECTION status
      const procurement = await tx.procurement.create({
        data: {
          bookingId: booking.id,
          farmerId,
          cropType,
          expectedQuantity: expectedQuantityQ,
          quantityUnit: unit,
          originalQuantity: quantity,
          expectedQuantityKg,
          status: 'PENDING_INSPECTION',
        },
      });

      // 7. Ensure Queue record exists for this centre & date
      await tx.queue.upsert({
        where: {
          centreId_date: {
            centreId,
            date: slot.date,
          },
        },
        update: {},
        create: {
          centreId,
          date: slot.date,
          currentlyServing: 'A-001',
        },
      });

      // 8. Create in-app Notification
      await tx.notification.create({
        data: {
          farmerId,
          type: 'SLOT_CONFIRMED',
          title: 'Procurement Slot Confirmed',
          message: `Slot booked successfully for ${cropType} (${dualFormatted}). Token: ${tokenNumber} at ${slot.centre.name} on ${slot.date} (${slot.startTime}-${slot.endTime}).`,
        },
      });

      return { booking, procurement, slot, dualFormatted };
    });

    // Simulated SMS alert to farmer
    logSimulatedSMS(
      farmer.mobileNumber,
      `Kisan Setu: Slot confirmed for ${cropType} (${bookingResult.dualFormatted}). Token: ${bookingResult.booking.tokenNumber}. Date: ${bookingResult.slot.date}, Time: ${bookingResult.slot.startTime}-${bookingResult.slot.endTime} at ${bookingResult.slot.centre.name}. Ref: ${bookingResult.booking.bookingReference}. Please arrive 15 mins early.`
    );

    // QR Code data payload (strictly non-sensitive)
    const qrData = JSON.stringify({
      bookingReference: bookingResult.booking.bookingReference,
      farmerId: bookingResult.booking.farmerId,
      tokenNumber: bookingResult.booking.tokenNumber,
      centreId: bookingResult.booking.centreId,
      cropType: bookingResult.booking.cropType,
    });

    res.status(201).json({
      success: true,
      message: 'Procurement slot booked successfully.',
      booking: {
        id: bookingResult.booking.id,
        bookingReference: bookingResult.booking.bookingReference,
        tokenNumber: bookingResult.booking.tokenNumber,
        farmerName: farmer.fullName,
        centreName: bookingResult.slot.centre.name,
        centreAddress: bookingResult.slot.centre.address,
        centreLatitude: bookingResult.slot.centre.latitude,
        centreLongitude: bookingResult.slot.centre.longitude,
        centrePhone: bookingResult.slot.centre.phoneNumber,
        officerName: bookingResult.slot.centre.contactOfficerName || null,
        officerContactNumber: bookingResult.slot.centre.contactOfficerNumber || null,
        date: bookingResult.slot.date,
        timeSlot: `${bookingResult.slot.startTime} – ${bookingResult.slot.endTime}`,
        cropType: bookingResult.booking.cropType,
        expectedQuantity: bookingResult.booking.expectedQuantity,
        quantityUnit: bookingResult.booking.quantityUnit,
        originalQuantity: bookingResult.booking.originalQuantity,
        expectedQuantityKg: bookingResult.booking.expectedQuantityKg,
        dualQuantityDisplay: bookingResult.dualFormatted,
        status: bookingResult.booking.status,
        qrData,
        createdAt: bookingResult.booking.createdAt,
      },
    });
  } catch (error: any) {
    console.error('createBooking error:', error);
    if (error.message === 'SLOT_FULL') {
      res.status(409).json({
        success: false,
        message: 'This slot is now completely booked. Please select another recommended slot.',
      });
      return;
    }
    if (error.message === 'DUPLICATE_BOOKING_DATE') {
      res.status(409).json({
        success: false,
        message: 'You already have an active procurement booking scheduled for this date.',
      });
      return;
    }
    if (error.message === 'SLOT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Selected slot was not found.' });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to book slot. Please try again.',
    });
  }
}

/**
 * Get current active bookings for authenticated farmer
 */
export async function getMyBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const farmerId = req.user?.id;
    if (!farmerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        centre: true,
        slot: true,
        procurement: {
          include: {
            payment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = bookings.map((b) => {
      const expectedKg = b.expectedQuantityKg || (b.expectedQuantity ? b.expectedQuantity * 100 : 0);
      const dualDisplay = formatQuantityFromKg(expectedKg, b.quantityUnit || 'q').dualDisplay;

      return {
        id: b.id,
        bookingReference: b.bookingReference,
        tokenNumber: b.tokenNumber,
        centreId: b.centreId,
        centreName: b.centre.name,
        centreAddress: b.centre.address,
        centreLatitude: b.centre.latitude,
        centreLongitude: b.centre.longitude,
        centrePhone: b.centre.phoneNumber,
        officerName: b.centre.contactOfficerName || null,
        officerContactNumber: b.centre.contactOfficerNumber || null,
        date: b.slot.date,
        timeSlot: `${b.slot.startTime} – ${b.slot.endTime}`,
        cropType: b.cropType,
        expectedQuantity: b.expectedQuantity,
        quantityUnit: b.quantityUnit || 'q',
        originalQuantity: b.originalQuantity || b.expectedQuantity,
        expectedQuantityKg: expectedKg,
        dualQuantityDisplay: dualDisplay,
        status: b.status,
        procurement: b.procurement
          ? {
              id: b.procurement.id,
              status: b.procurement.status,
              quantityUnit: b.procurement.quantityUnit || b.quantityUnit || 'q',
              originalQuantity: b.procurement.originalQuantity || b.originalQuantity,
              expectedQuantityKg: b.procurement.expectedQuantityKg || expectedKg,
              actualReceivedQuantityKg: b.procurement.actualReceivedQuantityKg,
              acceptedQuantityKg: b.procurement.acceptedQuantityKg,
              rejectedQuantityKg: b.procurement.rejectedQuantityKg,
              acceptedQuantity: b.procurement.acceptedQuantity,
              qualityGrade: b.procurement.qualityGrade,
              inspectionDecision: b.procurement.inspectionDecision,
              rejectionReason: b.procurement.rejectionReason,
              officerRemarks: b.procurement.officerRemarks,
              ratePerQuintal: b.procurement.ratePerQuintal,
              totalAmount: b.procurement.totalAmount,
              inspectedAt: b.procurement.inspectedAt,
              approvedAt: b.procurement.approvedAt,
              payment: b.procurement.payment
                ? {
                    id: b.procurement.payment.id,
                    status: b.procurement.payment.status,
                    amount: b.procurement.payment.amount,
                    transactionReference: b.procurement.payment.transactionReference,
                    paidAt: b.procurement.payment.paidAt,
                  }
                : null,
            }
          : null,
        qrData: JSON.stringify({
          bookingReference: b.bookingReference,
          farmerId: b.farmerId,
          tokenNumber: b.tokenNumber,
          centreId: b.centreId,
          cropType: b.cropType,
        }),
        createdAt: b.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      bookings: formatted,
    });
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
}

/**
 * Get booking details by ID
 */
export async function getBookingById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const farmerId = req.user?.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        centre: true,
        slot: true,
        farmer: true,
        procurement: {
          include: { payment: true },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Authorization check: only owner farmer or officer can view
    if (req.user?.role === 'FARMER' && booking.farmerId !== farmerId) {
      res.status(403).json({ success: false, message: 'Access denied to this booking.' });
      return;
    }

    res.status(200).json({
      success: true,
      booking: {
        ...booking,
        qrData: JSON.stringify({
          bookingReference: booking.bookingReference,
          farmerId: booking.farmerId,
          tokenNumber: booking.tokenNumber,
          centreId: booking.centreId,
          cropType: booking.cropType,
        }),
      },
    });
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve booking.' });
  }
}
