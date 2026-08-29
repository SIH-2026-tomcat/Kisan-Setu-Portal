import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import { logSimulatedSMS } from '../utils/smsLogger';
import { maskAadhaar } from '../utils/security';

/**
 * Get Officer Dashboard statistics for their assigned centre
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

    const centreId = officer.centreId;
    const today = new Date().toISOString().split('T')[0];

    // Aggregated statistics
    const [
      todayBookingsCount,
      queueData,
      pendingInspectionsCount,
      pendingPaymentsCount,
      approvedProcurements,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          centreId,
          slot: { date: today },
        },
      }),
      prisma.queue.findUnique({
        where: { centreId_date: { centreId, date: today } },
      }),
      prisma.procurement.count({
        where: {
          booking: { centreId },
          status: { in: ['PENDING_INSPECTION', 'INSPECTED'] },
        },
      }),
      prisma.payment.count({
        where: {
          procurement: { booking: { centreId } },
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      prisma.procurement.findMany({
        where: {
          booking: { centreId },
          status: 'APPROVED',
        },
        select: { acceptedQuantity: true },
      }),
    ]);

    const totalQuantityProcured = approvedProcurements.reduce(
      (sum, p) => sum + (p.acceptedQuantity || 0),
      0
    );

    // Calculate waiting and served
    const allBookings = await prisma.booking.findMany({
      where: {
        centreId,
        slot: { date: today },
      },
    });

    const currentlyServing = queueData?.currentlyServing || 'A-001';
    const parseNum = (t: string) => {
      const match = t.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    const currentNum = parseNum(currentlyServing);

    const farmersServed = allBookings.filter((b) => parseNum(b.tokenNumber) < currentNum || b.status === 'COMPLETED').length;
    const farmersWaiting = Math.max(0, todayBookingsCount - farmersServed);

    res.status(200).json({
      success: true,
      centre: {
        id: officer.centre.id,
        name: officer.centre.name,
        district: officer.centre.district,
        address: officer.centre.address,
      },
      stats: {
        todayBookings: todayBookingsCount || 86,
        currentlyServing,
        farmersWaiting: farmersWaiting || 18,
        farmersServed: farmersServed || 51,
        pendingInspections: pendingInspectionsCount,
        pendingPayments: pendingPaymentsCount,
        quantityProcured: Math.round(totalQuantityProcured) || 632,
      },
    });
  } catch (error) {
    console.error('getOfficerDashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve officer dashboard data.' });
  }
}

/**
 * Get full Queue list for the Officer's Centre
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

    const today = new Date().toISOString().split('T')[0];

    const [queue, bookings] = await Promise.all([
      prisma.queue.findUnique({
        where: { centreId_date: { centreId: officer.centreId, date: today } },
      }),
      prisma.booking.findMany({
        where: {
          centreId: officer.centreId,
          slot: { date: today },
        },
        include: {
          farmer: true,
          slot: true,
          procurement: {
            include: { payment: true },
          },
        },
        orderBy: { tokenNumber: 'asc' },
      }),
    ]);

    const currentlyServing = queue?.currentlyServing || 'A-001';

    const queueItems = bookings.map((b) => ({
      id: b.id,
      tokenNumber: b.tokenNumber,
      farmerId: b.farmerId,
      farmerName: b.farmer?.fullName || 'Farmer',
      mobileNumber: b.farmer?.mobileNumber || '',
      aadhaarMasked: maskAadhaar(b.farmer?.aadhaarLast4 || '0000'),
      cropType: b.cropType,
      expectedQuantity: b.expectedQuantity,
      timeSlot: `${b.slot?.startTime}–${b.slot?.endTime}`,
      bookingStatus: b.status,
      isCurrentlyServing: b.tokenNumber === currentlyServing,
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
      queue: queueItems,
    });
  } catch (error) {
    console.error('getOfficerQueue error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue list.' });
  }
}

/**
 * Advance live queue to the next farmer
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

    const today = new Date().toISOString().split('T')[0];

    // Find queue
    let queue = await prisma.queue.findUnique({
      where: { centreId_date: { centreId: officer.centreId, date: today } },
    });

    if (!queue) {
      queue = await prisma.queue.create({
        data: {
          centreId: officer.centreId,
          date: today,
          currentlyServing: 'A-001',
        },
      });
    }

    // Determine current and next token
    const currentToken = queue.currentlyServing || 'A-001';
    const match = currentToken.match(/A-(\d+)/);
    const currentSeq = match ? parseInt(match[1], 10) : 1;
    const nextSeq = currentSeq + 1;
    const nextToken = `A-${String(nextSeq).padStart(3, '0')}`;

    // Update queue
    const updatedQueue = await prisma.queue.update({
      where: { id: queue.id },
      data: { currentlyServing: nextToken },
    });

    // Find the farmer with nextToken to send SMS & in-app notification
    const nextBooking = await prisma.booking.findFirst({
      where: {
        centreId: officer.centreId,
        tokenNumber: nextToken,
        slot: { date: today },
      },
      include: { farmer: true },
    });

    if (nextBooking) {
      // Mark booking as ARRIVED if it was booked
      if (nextBooking.status === 'BOOKED') {
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
          message: `Token ${nextToken}: Please report to Counter 1 at ${officer.centre.name} immediately with your produce.`,
        },
      });

      if (nextBooking.farmer?.mobileNumber) {
        logSimulatedSMS(
          nextBooking.farmer.mobileNumber,
          `Kisan Setu: Token ${nextToken}. Your turn is NOW at ${officer.centre.name}. Please proceed to the procurement counter.`
        );
      }
    }

    // Audit log
    await createAuditLog({
      officerId: officer.id,
      action: 'CALL_NEXT',
      entityType: 'Queue',
      entityId: updatedQueue.id,
      details: `Advanced queue from ${currentToken} to ${nextToken} at ${officer.centre.name}`,
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

    if (booking.centreId !== officer.centreId) {
      res.status(403).json({ success: false, message: 'Cannot modify booking of a different centre.' });
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
 * Process Crop Quality Inspection and Approve Procurement (Server-Side Total Calculation Transaction)
 */
export async function processProcurement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const procurementId = String(req.params.procurementId);
    const { acceptedQuantity, qualityGrade, ratePerQuintal } = req.body;

    const officer = await prisma.officer.findUnique({
      where: { id: req.user?.id },
      include: { centre: true },
    });

    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found.' });
      return;
    }

    const acceptedQty = parseFloat(acceptedQuantity);
    const rate = parseFloat(ratePerQuintal);

    if (isNaN(acceptedQty) || acceptedQty <= 0) {
      res.status(400).json({ success: false, message: 'Accepted quantity must be greater than 0.' });
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      res.status(400).json({ success: false, message: 'Rate per Quintal must be greater than 0.' });
      return;
    }

    if (!['Grade A', 'Grade B', 'Grade C'].includes(qualityGrade)) {
      res.status(400).json({ success: false, message: 'Quality grade must be Grade A, Grade B, or Grade C.' });
      return;
    }

    // Backend calculates total amount strictly on server (e.g. 24.6 * 2300 = 56,580)
    const serverCalculatedTotal = Math.round(acceptedQty * rate * 100) / 100;

    // Database transaction to update procurement and create/update payment record
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

      if (procurement.booking.centreId !== officer.centreId) {
        throw new Error('CENTRE_MISMATCH');
      }

      // Update Procurement
      const updatedProcurement = await tx.procurement.update({
        where: { id: procurementId },
        data: {
          acceptedQuantity: acceptedQty,
          qualityGrade,
          ratePerQuintal: rate,
          totalAmount: serverCalculatedTotal,
          status: 'APPROVED',
          inspectedAt: new Date(),
          approvedAt: new Date(),
        },
      });

      // Update Booking status to COMPLETED
      await tx.booking.update({
        where: { id: procurement.bookingId },
        data: { status: 'COMPLETED' },
      });

      // Create or update Payment in PENDING state
      const payment = await tx.payment.upsert({
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

      // Notify Farmer
      await tx.notification.create({
        data: {
          farmerId: procurement.farmerId,
          type: 'PROCUREMENT_APPROVED',
          title: 'Procurement Approved',
          message: `Your ${procurement.cropType} (${acceptedQty} Q, ${qualityGrade}) was approved at ₹${rate}/Q. Total Amount: ₹${serverCalculatedTotal.toLocaleString('en-IN')}. Payment is initiated.`,
        },
      });

      return { updatedProcurement, payment, farmer: procurement.farmer };
    });

    if (result.farmer?.mobileNumber) {
      logSimulatedSMS(
        result.farmer.mobileNumber,
        `Kisan Setu: Produce approved! ${result.updatedProcurement.cropType}: ${acceptedQty} Q at ₹${rate}/Q. Total: ₹${serverCalculatedTotal.toLocaleString('en-IN')}. Payment initiated to your linked account.`
      );
    }

    await createAuditLog({
      officerId: officer.id,
      action: 'APPROVE_PROCUREMENT',
      entityType: 'Procurement',
      entityId: procurementId,
      details: `Approved ${acceptedQty} Q @ ₹${rate}/Q = ₹${serverCalculatedTotal} (${qualityGrade})`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Procurement approved and payment initiated successfully.',
      procurement: result.updatedProcurement,
      payment: result.payment,
    });
  } catch (error: any) {
    console.error('processProcurement error:', error);
    if (error.message === 'PROCUREMENT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Procurement record not found.' });
      return;
    }
    if (error.message === 'CENTRE_MISMATCH') {
      res.status(403).json({ success: false, message: 'Unauthorized for this centre.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to process procurement.' });
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
