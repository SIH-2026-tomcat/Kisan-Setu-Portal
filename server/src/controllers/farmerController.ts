import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get all procurement trackings for the logged-in farmer
 */
export async function getMyProcurements(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const farmerId = req.user?.id;
    if (!farmerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const procurements = await prisma.procurement.findMany({
      where: { farmerId },
      include: {
        booking: {
          include: {
            centre: true,
            slot: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = procurements.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      bookingReference: p.booking.bookingReference,
      tokenNumber: p.booking.tokenNumber,
      centreName: p.booking.centre.name,
      centreAddress: p.booking.centre.address,
      date: p.booking.slot.date,
      timeSlot: `${p.booking.slot.startTime}–${p.booking.slot.endTime}`,
      cropType: p.cropType,
      expectedQuantity: p.expectedQuantity,
      acceptedQuantity: p.acceptedQuantity,
      qualityGrade: p.qualityGrade,
      ratePerQuintal: p.ratePerQuintal,
      totalAmount: p.totalAmount,
      status: p.status,
      inspectedAt: p.inspectedAt,
      approvedAt: p.approvedAt,
      bookingStatus: p.booking.status,
      payment: p.payment
        ? {
            id: p.payment.id,
            amount: p.payment.amount,
            status: p.payment.status,
            transactionReference: p.payment.transactionReference,
            paidAt: p.payment.paidAt,
            bankAccountLast4: p.payment.bankAccountLast4,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      procurements: formatted,
    });
  } catch (error) {
    console.error('getMyProcurements error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve procurement records.' });
  }
}

/**
 * Get all payment records for the logged-in farmer
 */
export async function getMyPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const farmerId = req.user?.id;
    if (!farmerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { farmerId },
      include: {
        procurement: {
          include: {
            booking: {
              include: { centre: true, slot: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = payments.map((pay) => ({
      id: pay.id,
      procurementId: pay.procurementId,
      bookingReference: pay.procurement.booking.bookingReference,
      centreName: pay.procurement.booking.centre.name,
      cropType: pay.procurement.cropType,
      acceptedQuantity: pay.procurement.acceptedQuantity,
      ratePerQuintal: pay.procurement.ratePerQuintal,
      amount: pay.amount,
      status: pay.status,
      transactionReference: pay.transactionReference,
      bankAccountLast4: pay.bankAccountLast4,
      processingAt: pay.processingAt,
      paidAt: pay.paidAt,
      createdAt: pay.createdAt,
    }));

    res.status(200).json({
      success: true,
      payments: formatted,
    });
  } catch (error) {
    console.error('getMyPayments error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment records.' });
  }
}

/**
 * Get all notifications for the logged-in farmer
 */
export async function getMyNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const farmerId = req.user?.id;
    if (!farmerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const farmerId = req.user?.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.farmerId !== farmerId) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}
