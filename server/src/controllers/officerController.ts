import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import { logSimulatedSMS } from '../utils/smsLogger';
import { maskAadhaar } from '../utils/security';
import { toKilograms, formatQuantityFromKg } from '../utils/quantityUtils';

/**
 * Get Officer Dashboard statistics for their assigned centre (or selected centre)
 */
export async function getOfficerDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const officerId = req.user?.id;
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const { centreId: requestedCentreId } = req.query;
    const targetCentreId = (requestedCentreId as string) || officer.centreId;
    const targetCentre =
      (await prisma.procurementCentre.findUnique({
        where: { id: targetCentreId },
      })) || officer.centre;

    const today = new Date().toISOString().split('T')[0];

    // Aggregated statistics for target centre
    const [
      totalBookingsCount,
      todayBookingsCount,
      queueData,
      pendingInspectionsCount,
      pendingPaymentsCount,
      approvedProcurements,
      recentBookings,
      allCentres,
      onHoldBookings,
      reassignedTodayCount,
      cancelledMissedCount,
    ] = await Promise.all([
      prisma.booking.count({
        where: { centreId: targetCentreId },
      }),
      prisma.booking.count({
        where: {
          centreId: targetCentreId,
          slot: { date: today },
        },
      }),
      prisma.queue.findUnique({
        where: { centreId_date: { centreId: targetCentreId, date: today } },
      }),
      prisma.procurement.count({
        where: {
          booking: { centreId: targetCentreId },
          status: { in: ['PENDING_INSPECTION', 'INSPECTED'] },
        },
      }),
      prisma.payment.count({
        where: {
          procurement: { booking: { centreId: targetCentreId } },
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      prisma.procurement.findMany({
        where: {
          booking: { centreId: targetCentreId },
          status: 'APPROVED',
        },
        select: { acceptedQuantity: true },
      }),
      prisma.booking.findMany({
        where: { centreId: targetCentreId },
        include: {
          farmer: true,
          slot: true,
          procurement: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.procurementCentre.findMany({
        where: { active: true },
        select: { id: true, name: true, district: true },
      }),
      prisma.booking.findMany({
        where: {
          centreId: targetCentreId,
          status: 'ON_HOLD',
        },
        include: {
          farmer: true,
          slot: true,
        },
        orderBy: { heldAt: 'desc' },
      }),
      prisma.booking.count({
        where: {
          centreId: targetCentreId,
          status: 'REASSIGNED',
          slot: { date: today },
        },
      }),
      prisma.booking.count({
        where: {
          centreId: targetCentreId,
          status: 'CANCELLED',
          cancellationReason: 'MISSED_SLOT_NO_CAPACITY',
          slot: { date: today },
        },
      }),
    ]);

    const totalQuantityProcured = approvedProcurements.reduce(
      (sum, p) => sum + (p.acceptedQuantity || 0),
      0
    );

    const currentlyServing = queueData?.currentlyServing || 'A-001';
    const parseNum = (t: string) => {
      const match = t.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    const currentNum = parseNum(currentlyServing);

    const allCentreBookings = await prisma.booking.findMany({
      where: { centreId: targetCentreId },
    });

    const farmersServed = allCentreBookings.filter(
      (b) => parseNum(b.tokenNumber) < currentNum || b.status === 'COMPLETED'
    ).length;
    const farmersWaiting = Math.max(0, totalBookingsCount - farmersServed);

    res.status(200).json({
      success: true,
      centre: {
        id: targetCentre.id,
        name: targetCentre.name,
        district: targetCentre.district,
        address: targetCentre.address,
      },
      centres: allCentres,
      stats: {
        todayBookings: todayBookingsCount,
        totalBookings: totalBookingsCount,
        currentlyServing,
        farmersWaiting,
        farmersServed,
        pendingInspections: pendingInspectionsCount,
        pendingPayments: pendingPaymentsCount,
        quantityProcured: Math.round(totalQuantityProcured),
        onHoldCount: onHoldBookings.length,
        reassignedToday: reassignedTodayCount,
        cancelledMissed: cancelledMissedCount,
      },
      onHoldBookings: onHoldBookings.map((b) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        tokenNumber: b.tokenNumber,
        originalTokenNumber: b.originalTokenNumber || b.tokenNumber,
        farmerId: b.farmerId,
        farmerName: b.farmer?.fullName || 'Farmer',
        mobileNumber: b.farmer?.mobileNumber || '',
        aadhaarMasked: maskAadhaar(b.farmer?.aadhaarLast4 || '0000'),
        cropType: b.cropType,
        expectedQuantity: b.expectedQuantity,
        quantityUnit: b.quantityUnit,
        date: b.slot?.date || today,
        timeSlot: b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '09:00–10:00',
        heldAt: b.heldAt,
        status: b.status,
      })),
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        tokenNumber: b.tokenNumber,
        originalTokenNumber: b.originalTokenNumber,
        farmerId: b.farmerId,
        farmerName: b.farmer?.fullName || 'Farmer',
        mobileNumber: b.farmer?.mobileNumber || '',
        aadhaarMasked: maskAadhaar(b.farmer?.aadhaarLast4 || '0000'),
        cropType: b.cropType,
        expectedQuantity: b.expectedQuantity,
        quantityUnit: b.quantityUnit,
        date: b.slot?.date || today,
        timeSlot: b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '09:00–10:00',
        status: b.status,
        cancellationReason: b.cancellationReason,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error('getOfficerDashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve officer dashboard data.' });
  }
}

/**
 * Get full Queue list for the Officer's Centre (supports date and centreId filtering)
 */
export async function getOfficerQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const { date, centreId: requestedCentreId } = req.query;
    const targetCentreId = (requestedCentreId as string) || officer.centreId;
    const today = new Date().toISOString().split('T')[0];

    let slotWhere: any = {};
    if (date && typeof date === 'string' && date !== 'ALL') {
      slotWhere = { date };
    }

    const [queue, bookings, allCentres] = await Promise.all([
      prisma.queue.findUnique({
        where: {
          centreId_date: {
            centreId: targetCentreId,
            date: typeof date === 'string' && date !== 'ALL' ? date : today,
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          centreId: targetCentreId,
          ...(Object.keys(slotWhere).length > 0 ? { slot: slotWhere } : {}),
        },
        include: {
          farmer: true,
          slot: true,
          procurement: {
            include: { payment: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.procurementCentre.findMany({
        where: { active: true },
        select: { id: true, name: true, district: true },
      }),
    ]);

    const currentlyServing = queue?.currentlyServing || 'A-001';

    const queueItems = bookings.map((b) => ({
      id: b.id,
      bookingReference: b.bookingReference,
      tokenNumber: b.tokenNumber,
      originalTokenNumber: b.originalTokenNumber || b.tokenNumber,
      farmerId: b.farmerId,
      farmerName: b.farmer?.fullName || 'Farmer',
      mobileNumber: b.farmer?.mobileNumber || '',
      aadhaarMasked: maskAadhaar(b.farmer?.aadhaarLast4 || '0000'),
      cropType: b.cropType,
      expectedQuantity: b.expectedQuantity,
      quantityUnit: b.quantityUnit,
      date: b.slot?.date || today,
      timeSlot: b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '09:00–10:00',
      bookingStatus: b.status,
      heldAt: b.heldAt,
      reassignedAt: b.reassignedAt,
      cancellationReason: b.cancellationReason,
      isCurrentlyServing: b.tokenNumber === currentlyServing,
      createdAt: b.createdAt,
      procurement: b.procurement
        ? {
            id: b.procurement.id,
            status: b.procurement.status,
            acceptedQuantity: b.procurement.acceptedQuantity,
            qualityGrade: b.procurement.qualityGrade,
            ratePerQuintal: b.procurement.ratePerQuintal,
            totalAmount: b.procurement.totalAmount,
            payment: b.procurement.payment
              ? {
                  id: b.procurement.payment.id,
                  status: b.procurement.payment.status,
                  amount: b.procurement.payment.amount,
                  transactionReference: b.procurement.payment.transactionReference,
                }
              : null,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      currentlyServing,
      centreId: targetCentreId,
      centres: allCentres,
      totalBookings: queueItems.length,
      queue: queueItems,
    });
  } catch (error) {
    console.error('getOfficerQueue error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue list.' });
  }
}

/**
 * Advance live queue to the next farmer, automatically skipping ON_HOLD and CANCELLED bookings
 */
export async function callNextFarmer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const { centreId: requestedCentreId } = req.body || {};
    const targetCentreId = requestedCentreId || officer.centreId;
    const targetCentre =
      (await prisma.procurementCentre.findUnique({ where: { id: targetCentreId } })) ||
      officer.centre;

    const today = new Date().toISOString().split('T')[0];

    // Find queue
    let queue = await prisma.queue.findUnique({
      where: { centreId_date: { centreId: targetCentreId, date: today } },
    });

    if (!queue) {
      queue = await prisma.queue.create({
        data: {
          centreId: targetCentreId,
          date: today,
          currentlyServing: 'A-001',
        },
      });
    }

    // Determine current and next token
    const currentToken = queue.currentlyServing || 'A-001';
    const match = currentToken.match(/\d+/);
    const currentSeq = match ? parseInt(match[0], 10) : 1;

    // Find all today's active bookings that can be served (skipping ON_HOLD, CANCELLED, REJECTED, COMPLETED)
    const activeBookings = await prisma.booking.findMany({
      where: {
        centreId: targetCentreId,
        slot: { date: today },
        status: { in: ['BOOKED', 'ARRIVED', 'REASSIGNED'] },
      },
      include: { farmer: true },
      orderBy: { tokenNumber: 'asc' },
    });

    const parseNum = (t: string) => {
      const m = t.match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };

    // Find first active booking whose sequence is strictly greater than currentSeq
    const nextBooking = activeBookings.find((b) => parseNum(b.tokenNumber) > currentSeq);
    const nextToken = nextBooking
      ? nextBooking.tokenNumber
      : `A-${String(currentSeq + 1).padStart(3, '0')}`;

    // Update queue
    const updatedQueue = await prisma.queue.update({
      where: { id: queue.id },
      data: { currentlyServing: nextToken },
    });

    if (nextBooking) {
      // Mark booking as ARRIVED if it was booked/reassigned
      if (nextBooking.status === 'BOOKED' || nextBooking.status === 'REASSIGNED') {
        await prisma.booking.update({
          where: { id: nextBooking.id },
          data: { status: 'ARRIVED' },
        });
      }

      await prisma.notification.create({
        data: {
          farmerId: nextBooking.farmerId,
          type: 'TURN_APPROACHING',
          title: 'Your Turn at Procurement Counter',
          message: `Token ${nextToken}: Please report to Counter 1 at ${targetCentre.name} immediately with your produce.`,
        },
      });

      if (nextBooking.farmer?.mobileNumber) {
        logSimulatedSMS(
          nextBooking.farmer.mobileNumber,
          `Kisan Setu: Token ${nextToken}. Your turn is NOW at ${targetCentre.name}. Please proceed to the procurement counter.`
        );
      }
    }

    // Audit log
    await createAuditLog({
      officerId: officer.id,
      action: 'CALL_NEXT',
      entityType: 'Queue',
      entityId: updatedQueue.id,
      details: `Advanced queue from ${currentToken} to ${nextToken} at ${targetCentre.name}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Queue advanced to token ${nextToken}`,
      currentlyServing: nextToken,
      calledFarmer: nextBooking?.farmer?.fullName || null,
    });
  } catch (error) {
    console.error('callNextFarmer error:', error);
    res.status(500).json({ success: false, message: 'Failed to advance queue.' });
  }
}

/**
 * Mark farmer arrived at procurement centre
 */
export async function markFarmerArrived(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { bookingId } = req.body;
    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(bookingId) },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: String(bookingId) },
      data: { status: 'ARRIVED' },
    });

    await createAuditLog({
      officerId: officer.id,
      action: 'MARK_ARRIVED',
      entityType: 'Booking',
      entityId: booking.id,
      details: `Farmer arrived for token ${booking.tokenNumber}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Farmer arrival marked successfully.',
      booking: updated,
    });
  } catch (error) {
    console.error('markFarmerArrived error:', error);
    res.status(500).json({ success: false, message: 'Failed to update arrival status.' });
  }
}

/**
 * Place a farmer's missed booking on hold
 */
export async function holdBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = String(req.params.bookingId);
    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { farmer: true, slot: { include: { centre: true } } },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED' || booking.status === 'REJECTED') {
      res.status(400).json({ success: false, message: `Cannot place booking with status ${booking.status} on hold.` });
      return;
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'ON_HOLD',
          heldAt: new Date(),
        },
        include: { farmer: true, slot: true },
      });

      // In-app notification
      await tx.notification.create({
        data: {
          farmerId: booking.farmerId,
          type: 'SLOT_ON_HOLD',
          title: 'Procurement Slot On Hold',
          message: `Your appointment (Token ${booking.tokenNumber}) for slot ${booking.slot.startTime}–${booking.slot.endTime} was missed and has been placed ON HOLD. Please report to ${booking.slot.centre.name} immediately.`,
        },
      });

      return updated;
    });

    if (booking.farmer?.mobileNumber) {
      logSimulatedSMS(
        booking.farmer.mobileNumber,
        `Kisan Setu: Your scheduled slot (${booking.slot.startTime}–${booking.slot.endTime}) was missed. Token ${booking.tokenNumber} placed ON HOLD. Please report to ${booking.slot.centre.name}.`
      );
    }

    await createAuditLog({
      officerId: officer.id,
      action: 'BOOKING_PLACED_ON_HOLD',
      entityType: 'Booking',
      entityId: booking.id,
      details: `Placed booking ${booking.tokenNumber} (Ref: ${booking.bookingReference}) ON HOLD for farmer ${booking.farmer.fullName}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${booking.farmer.fullName} (Token ${booking.tokenNumber}) placed on hold.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('holdBooking error:', error);
    res.status(500).json({ success: false, message: 'Failed to place booking on hold.' });
  }
}

/**
 * Check later available slots for reassignment on the same day and same centre
 */
export async function getReassignmentSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = String(req.params.bookingId);
    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        farmer: true,
        slot: { include: { centre: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.status !== 'ON_HOLD') {
      res.status(400).json({ success: false, message: 'Only bookings with ON_HOLD status can be reassigned.' });
      return;
    }

    // Query all slots for the same centre and date
    const allSlots = await prisma.slot.findMany({
      where: {
        centreId: booking.centreId,
        date: booking.slot.date,
      },
      orderBy: { startTime: 'asc' },
    });

    // Filter slots with available capacity
    const availableSlots = allSlots
      .filter((s) => s.id !== booking.slotId && s.bookedCount < s.capacity)
      .map((s, idx) => {
        const remainingCapacity = s.capacity - s.bookedCount;
        return {
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          date: s.date,
          capacity: s.capacity,
          bookedCount: s.bookedCount,
          remainingCapacity,
          isRecommended: idx === 0, // Recommend earliest available slot
        };
      });

    await createAuditLog({
      officerId: officer.id,
      action: 'LATE_FARMER_SLOT_CHECKED',
      entityType: 'Booking',
      entityId: booking.id,
      details: `Checked reassignment slots for booking ${booking.tokenNumber}. Found ${availableSlots.length} available slots.`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        tokenNumber: booking.tokenNumber,
        originalTokenNumber: booking.originalTokenNumber || booking.tokenNumber,
        farmerName: booking.farmer.fullName,
        mobileNumber: booking.farmer.mobileNumber,
        cropType: booking.cropType,
        expectedQuantity: booking.expectedQuantity,
        quantityUnit: booking.quantityUnit,
        date: booking.slot.date,
        originalSlot: `${booking.slot.startTime}–${booking.slot.endTime}`,
        status: booking.status,
      },
      hasAvailableSlots: availableSlots.length > 0,
      slots: availableSlots,
    });
  } catch (error) {
    console.error('getReassignmentSlots error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve available reassignment slots.' });
  }
}

/**
 * Reassign an ON_HOLD farmer to an available later slot
 */
export async function reassignBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = String(req.params.bookingId);
    const { targetSlotId } = req.body;

    if (!targetSlotId) {
      res.status(400).json({ success: false, message: 'targetSlotId is required for reassignment.' });
      return;
    }

    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { farmer: true, slot: true },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      if (booking.status !== 'ON_HOLD') {
        throw new Error('NOT_ON_HOLD');
      }

      // 2. Fetch and validate target slot
      const targetSlot = await tx.slot.findUnique({
        where: { id: String(targetSlotId) },
        include: { centre: true },
      });

      if (!targetSlot) {
        throw new Error('SLOT_NOT_FOUND');
      }

      if (targetSlot.centreId !== booking.centreId) {
        throw new Error('CENTRE_MISMATCH');
      }

      if (targetSlot.date !== booking.slot.date) {
        throw new Error('DATE_MISMATCH');
      }

      // 3. Strict capacity check
      if (targetSlot.bookedCount >= targetSlot.capacity) {
        throw new Error('SLOT_FULL');
      }

      // 4. Release old slot capacity (decrement 1)
      if (booking.slot.bookedCount > 0) {
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { bookedCount: { decrement: 1 } },
        });
      }

      // 5. Increment target slot capacity
      await tx.slot.update({
        where: { id: targetSlot.id },
        data: { bookedCount: { increment: 1 } },
      });

      // 6. Generate new sequential token for today's queue
      const totalBookingsToday = await tx.booking.count({
        where: {
          centreId: booking.centreId,
          slot: { date: targetSlot.date },
        },
      });
      const newTokenNumber = `A-${String(totalBookingsToday + 1).padStart(3, '0')}`;
      const oldToken = booking.tokenNumber;
      const oldSlotStr = `${booking.slot.startTime}–${booking.slot.endTime}`;
      const newSlotStr = `${targetSlot.startTime}–${targetSlot.endTime}`;

      // 7. Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'REASSIGNED',
          slotId: targetSlot.id,
          originalSlotId: booking.originalSlotId || booking.slotId,
          originalTokenNumber: booking.originalTokenNumber || booking.tokenNumber,
          tokenNumber: newTokenNumber,
          reassignedAt: new Date(),
        },
        include: {
          farmer: true,
          slot: { include: { centre: true } },
        },
      });

      // 8. Create farmer notification
      await tx.notification.create({
        data: {
          farmerId: booking.farmerId,
          type: 'SLOT_REASSIGNED',
          title: 'Procurement Slot Reassigned',
          message: `Your missed procurement slot (${oldSlotStr}) has been reassigned. New Slot: ${newSlotStr} (Token: ${newTokenNumber}) at ${targetSlot.centre.name}.`,
        },
      });

      return { updatedBooking, oldToken, newTokenNumber, oldSlotStr, newSlotStr };
    });

    // Simulated SMS
    if (result.updatedBooking.farmer?.mobileNumber) {
      logSimulatedSMS(
        result.updatedBooking.farmer.mobileNumber,
        `Kisan Setu: Your procurement slot has been reassigned to ${result.newSlotStr}. Token: ${result.newTokenNumber}. Ref: ${result.updatedBooking.bookingReference}. Please report before your slot time.`
      );
    }

    // Audit log
    await createAuditLog({
      officerId: officer.id,
      action: 'BOOKING_REASSIGNED',
      entityType: 'Booking',
      entityId: result.updatedBooking.id,
      details: `Reassigned late booking from token ${result.oldToken} (${result.oldSlotStr}) to token ${result.newTokenNumber} (${result.newSlotStr}) for farmer ${result.updatedBooking.farmer.fullName}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Farmer successfully reassigned to ${result.newSlotStr}. New Token: ${result.newTokenNumber}`,
      booking: result.updatedBooking,
      newSlot: result.newSlotStr,
      newToken: result.newTokenNumber,
    });
  } catch (error: any) {
    console.error('reassignBooking error:', error);
    if (error.message === 'SLOT_FULL') {
      res.status(409).json({ success: false, message: 'This slot is already full. Please select another available slot.' });
      return;
    }
    if (error.message === 'NOT_ON_HOLD') {
      res.status(400).json({ success: false, message: 'Booking must be in ON_HOLD status to be reassigned.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to reassign booking.' });
  }
}

/**
 * Cancel an ON_HOLD booking when no remaining slots have capacity today
 */
export async function cancelMissedBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = String(req.params.bookingId);
    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          farmer: true,
          slot: { include: { centre: true } },
          procurement: { include: { payment: true } },
        },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      if (booking.status !== 'ON_HOLD') {
        throw new Error('NOT_ON_HOLD');
      }

      // Release slot count if occupied
      if (booking.slot.bookedCount > 0) {
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { bookedCount: { decrement: 1 } },
        });
      }

      // Delete payment and procurement if any existed
      if (booking.procurement) {
        if (booking.procurement.payment) {
          await tx.payment.delete({ where: { procurementId: booking.procurement.id } });
        }
        await tx.procurement.delete({ where: { id: booking.procurement.id } });
      }

      // Update booking to CANCELLED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'MISSED_SLOT_NO_CAPACITY',
          cancelledByOfficerId: officer.id,
        },
        include: { farmer: true, slot: true },
      });

      // In-app cancellation notification
      await tx.notification.create({
        data: {
          farmerId: booking.farmerId,
          type: 'SLOT_CANCELLED',
          title: 'Procurement Slot Cancelled',
          message: `Your procurement booking for today has been cancelled because you missed your scheduled slot (${booking.slot.startTime}–${booking.slot.endTime}) and no additional slots remain available today.`,
        },
      });

      return { updatedBooking, farmer: booking.farmer, slot: booking.slot };
    });

    // Simulated SMS
    if (result.farmer?.mobileNumber) {
      logSimulatedSMS(
        result.farmer.mobileNumber,
        `Kisan Setu: Your procurement booking (${result.updatedBooking.bookingReference}) has been cancelled because your scheduled slot was missed and no slots remain available today.`
      );
    }

    // Audit log
    await createAuditLog({
      officerId: officer.id,
      action: 'MISSED_BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: result.updatedBooking.id,
      details: `Cancelled missed booking ${result.updatedBooking.tokenNumber} (Ref: ${result.updatedBooking.bookingReference}) for farmer ${result.farmer.fullName}. Reason: MISSED_SLOT_NO_CAPACITY`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Missed booking cancelled successfully due to no remaining capacity.',
      booking: result.updatedBooking,
    });
  } catch (error: any) {
    console.error('cancelMissedBooking error:', error);
    if (error.message === 'NOT_ON_HOLD') {
      res.status(400).json({ success: false, message: 'Only ON_HOLD bookings can be cancelled as missed.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to cancel missed booking.' });
  }
}

/**
 * Process Crop Quality Inspection (Fully Accepted, Partially Accepted, or Rejected)
 * Enforces backend financial calculation and mandatory rejection reasons.
 */
export async function processProcurement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const procurementId = String(req.params.procurementId);
    const {
      actualReceivedQuantity,
      actualReceivedUnit = 'q',
      acceptedQuantity,
      acceptedUnit = 'q',
      qualityGrade,
      inspectionDecision,
      rejectionReason,
      officerRemarks,
      ratePerQuintal,
    } = req.body;

    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer account not found.' });
      return;
    }

    // 1. Validate Actual Received Quantity
    const receivedVal = parseFloat(actualReceivedQuantity);
    if (isNaN(receivedVal) || receivedVal <= 0) {
      res.status(400).json({ success: false, message: 'Actual received quantity must be greater than 0.' });
      return;
    }

    const actualReceivedQuantityKg = toKilograms(receivedVal, actualReceivedUnit);

    // 2. Validate Quality Grade
    const validGrades = ['Grade A', 'Grade B', 'Grade C', 'Below Standard'];
    if (!validGrades.includes(qualityGrade)) {
      res.status(400).json({ success: false, message: `Quality grade must be one of: ${validGrades.join(', ')}.` });
      return;
    }

    // 3. Validate Inspection Decision
    const validDecisions = ['FULLY_ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'];
    if (!validDecisions.includes(inspectionDecision)) {
      res.status(400).json({ success: false, message: `Inspection decision must be FULLY_ACCEPTED, PARTIALLY_ACCEPTED, or REJECTED.` });
      return;
    }

    let acceptedQuantityKg = 0;
    let rejectedQuantityKg = 0;

    if (inspectionDecision === 'FULLY_ACCEPTED') {
      acceptedQuantityKg = actualReceivedQuantityKg;
      rejectedQuantityKg = 0;
    } else if (inspectionDecision === 'PARTIALLY_ACCEPTED') {
      const acceptedVal = parseFloat(acceptedQuantity);
      if (isNaN(acceptedVal) || acceptedVal <= 0) {
        res.status(400).json({ success: false, message: 'Accepted quantity must be greater than 0 for partial acceptance.' });
        return;
      }
      acceptedQuantityKg = toKilograms(acceptedVal, acceptedUnit);

      if (acceptedQuantityKg >= actualReceivedQuantityKg) {
        res.status(400).json({ success: false, message: 'Accepted quantity must be strictly less than actual received quantity for partial acceptance.' });
        return;
      }

      rejectedQuantityKg = Math.round((actualReceivedQuantityKg - acceptedQuantityKg) * 100) / 100;

      if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
        res.status(400).json({ success: false, message: 'Rejection/partial-acceptance reason is mandatory.' });
        return;
      }

      if (rejectionReason === 'Other' && (!officerRemarks || !officerRemarks.trim())) {
        res.status(400).json({ success: false, message: 'Additional remarks are mandatory when reason is Other.' });
        return;
      }
    } else if (inspectionDecision === 'REJECTED') {
      acceptedQuantityKg = 0;
      rejectedQuantityKg = actualReceivedQuantityKg;

      if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
        res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
        return;
      }

      if (rejectionReason === 'Other' && (!officerRemarks || !officerRemarks.trim())) {
        res.status(400).json({ success: false, message: 'Additional remarks are mandatory when reason is Other.' });
        return;
      }
    }

    // 4. Rate per Quintal validation (if accepted)
    let rate = 0;
    let serverCalculatedTotal = 0;

    if (inspectionDecision !== 'REJECTED') {
      rate = parseFloat(ratePerQuintal);
      if (isNaN(rate) || rate <= 0) {
        res.status(400).json({ success: false, message: 'Rate per Quintal must be greater than 0.' });
        return;
      }
      const acceptedQuintals = acceptedQuantityKg / 100;
      serverCalculatedTotal = Math.round(acceptedQuintals * rate * 100) / 100;
    }

    const acceptedQ = Math.round((acceptedQuantityKg / 100) * 100) / 100;

    // Database transaction to update procurement, booking, and payment
    const result = await prisma.$transaction(async (tx) => {
      const procurement = await tx.procurement.findUnique({
        where: { id: procurementId },
        include: {
          booking: true,
          farmer: true,
        },
      });

      if (!procurement) {
        throw new Error('PROCUREMENT_NOT_FOUND');
      }

      const isRejection = inspectionDecision === 'REJECTED';

      // Update Procurement record
      const updatedProcurement = await tx.procurement.update({
        where: { id: procurementId },
        data: {
          actualReceivedQuantityKg,
          acceptedQuantityKg,
          rejectedQuantityKg,
          acceptedQuantity: acceptedQ,
          qualityGrade,
          inspectionDecision,
          rejectionReason: isRejection || inspectionDecision === 'PARTIALLY_ACCEPTED' ? rejectionReason : null,
          officerRemarks: officerRemarks || null,
          ratePerQuintal: isRejection ? 0 : rate,
          totalAmount: isRejection ? 0 : serverCalculatedTotal,
          status: isRejection ? 'REJECTED' : 'APPROVED',
          inspectedAt: new Date(),
          approvedAt: isRejection ? null : new Date(),
        },
      });

      // Update Booking status
      await tx.booking.update({
        where: { id: procurement.bookingId },
        data: { status: isRejection ? 'REJECTED' : 'COMPLETED' },
      });

      let payment = null;

      if (!isRejection && serverCalculatedTotal > 0) {
        // Create or update Payment in PENDING state
        payment = await tx.payment.upsert({
          where: { procurementId },
          update: {
            amount: serverCalculatedTotal,
            status: 'PENDING',
          },
          create: {
            procurementId,
            farmerId: procurement.farmerId,
            amount: serverCalculatedTotal,
            status: 'PENDING',
          },
        });
      } else {
        // Ensure no active payment exists for rejected produce
        const existingPayment = await tx.payment.findUnique({
          where: { procurementId },
        });
        if (existingPayment) {
          await tx.payment.delete({ where: { procurementId } });
        }
      }

      // Format notification messages
      let notifTitle = 'Procurement Approved';
      let notifMsg = `Your ${procurement.cropType} procurement has been approved (${formatQuantityFromKg(acceptedQuantityKg, 'q').dualDisplay}). Total: ₹${serverCalculatedTotal.toLocaleString('en-IN')}.`;
      let smsMsg = `Kisan Setu: Produce approved! ${procurement.cropType}: ${formatQuantityFromKg(acceptedQuantityKg, 'q').dualDisplay} at ₹${rate}/Q. Total: ₹${serverCalculatedTotal.toLocaleString('en-IN')}. Payment initiated.`;

      if (inspectionDecision === 'PARTIALLY_ACCEPTED') {
        notifTitle = 'Procurement Partially Accepted';
        notifMsg = `Your ${procurement.cropType} procurement was partially accepted. ${formatQuantityFromKg(acceptedQuantityKg, 'kg').displayString} accepted, ${formatQuantityFromKg(rejectedQuantityKg, 'kg').displayString} rejected. Reason: ${rejectionReason}. Total: ₹${serverCalculatedTotal.toLocaleString('en-IN')}.`;
        smsMsg = `Kisan Setu: Produce partially accepted. ${formatQuantityFromKg(acceptedQuantityKg, 'kg').displayString} accepted, ${formatQuantityFromKg(rejectedQuantityKg, 'kg').displayString} rejected. Reason: ${rejectionReason}. Total: ₹${serverCalculatedTotal.toLocaleString('en-IN')}.`;
      } else if (inspectionDecision === 'REJECTED') {
        notifTitle = 'Procurement Rejected';
        notifMsg = `Your ${procurement.cropType} procurement was not accepted. Reason: ${rejectionReason}. ${officerRemarks ? 'Remarks: ' + officerRemarks : ''}`;
        smsMsg = `Kisan Setu: Produce not accepted. ${procurement.cropType} rejected. Reason: ${rejectionReason}. Check app for details.`;
      }

      // Notify Farmer
      await tx.notification.create({
        data: {
          farmerId: procurement.farmerId,
          type: isRejection ? 'PROCUREMENT_REJECTED' : 'PROCUREMENT_APPROVED',
          title: notifTitle,
          message: notifMsg,
        },
      });

      return { updatedProcurement, payment, farmer: procurement.farmer, smsMsg };
    });

    if (result.farmer?.mobileNumber) {
      logSimulatedSMS(result.farmer.mobileNumber, result.smsMsg);
    }

    // Audit log
    await createAuditLog({
      officerId: officer.id,
      action: `INSPECTION_${inspectionDecision}`,
      entityType: 'Procurement',
      entityId: procurementId,
      details: `Physical inspection [${inspectionDecision}]: Received ${actualReceivedQuantityKg}kg, Accepted ${acceptedQuantityKg}kg, Rejected ${rejectedQuantityKg}kg, Grade ${qualityGrade}, Reason: ${rejectionReason || 'N/A'}, Payout: ₹${serverCalculatedTotal}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: inspectionDecision === 'REJECTED'
        ? 'Procurement rejected and recorded in system.'
        : 'Procurement inspected and payment initiated successfully.',
      procurement: result.updatedProcurement,
      payment: result.payment,
    });
  } catch (error: any) {
    console.error('processProcurement error:', error);
    if (error.message === 'PROCUREMENT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Procurement record not found.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to process procurement inspection.' });
  }
}

/**
 * Update Payment Status (Enforces Pending -> Processing -> Paid state machine)
 */
export async function updatePaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const paymentId = String(req.params.paymentId);
    const { nextStatus } = req.body; // 'PROCESSING' | 'PAID'

    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    if (!['PROCESSING', 'PAID'].includes(nextStatus)) {
      res.status(400).json({ success: false, message: 'Invalid payment status transition requested.' });
      return;
    }

    const currentPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        farmer: true,
        procurement: {
          include: { booking: true },
        },
      },
    });

    if (!currentPayment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    // Business rule: Cannot mark PAID directly from PENDING without PROCESSING
    if (nextStatus === 'PAID' && currentPayment.status === 'PENDING') {
      res.status(400).json({
        success: false,
        message: 'Payment must be in PROCESSING status before completing as PAID.',
      });
      return;
    }

    // Business rule: Cannot revert PAID back to PENDING/PROCESSING
    if (currentPayment.status === 'PAID') {
      res.status(400).json({
        success: false,
        message: 'Payment is already PAID and cannot be modified.',
      });
      return;
    }

    const updateData: any = { status: nextStatus };

    if (nextStatus === 'PROCESSING') {
      updateData.processingAt = new Date();
    } else if (nextStatus === 'PAID') {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      updateData.paidAt = new Date();
      updateData.transactionReference = `KS-PAY-2026-${randomSuffix}`;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    // Notifications & simulated SMS
    if (nextStatus === 'PROCESSING') {
      await prisma.notification.create({
        data: {
          farmerId: currentPayment.farmerId,
          type: 'PAYMENT_PROCESSING',
          title: 'Payment is Processing',
          message: `Your payment of ₹${currentPayment.amount.toLocaleString('en-IN')} is being processed by the bank.`,
        },
      });
      if (currentPayment.farmer?.mobileNumber) {
        logSimulatedSMS(
          currentPayment.farmer.mobileNumber,
          `Kisan Setu: Your payment of ₹${currentPayment.amount.toLocaleString('en-IN')} is now PROCESSING via PFMS/Bank Direct Deposit.`
        );
      }
    } else if (nextStatus === 'PAID') {
      await prisma.notification.create({
        data: {
          farmerId: currentPayment.farmerId,
          type: 'PAYMENT_COMPLETED',
          title: 'Payment Completed',
          message: `Payment of ₹${currentPayment.amount.toLocaleString('en-IN')} completed. Ref: ${updatedPayment.transactionReference}. Deposited to Account ending in ${currentPayment.bankAccountLast4}.`,
        },
      });
      if (currentPayment.farmer?.mobileNumber) {
        logSimulatedSMS(
          currentPayment.farmer.mobileNumber,
          `Kisan Setu: Payment COMPLETED! ₹${currentPayment.amount.toLocaleString('en-IN')} credited to A/C ending in ${currentPayment.bankAccountLast4}. Txn Ref: ${updatedPayment.transactionReference}. Thank you for using Kisan Setu.`
        );
      }
    }

    await createAuditLog({
      officerId: officer.id,
      action: nextStatus === 'PAID' ? 'COMPLETE_PAYMENT' : 'PROCESS_PAYMENT',
      entityType: 'Payment',
      entityId: paymentId,
      details: `Payment status updated to ${nextStatus} for amount ₹${currentPayment.amount}. Txn: ${updatedPayment.transactionReference || 'N/A'}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${nextStatus}.`,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('updatePaymentStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment status.' });
  }
}

/**
 * Get audit logs for officer's centre
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        officer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            centre: { select: { name: true } },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
}
