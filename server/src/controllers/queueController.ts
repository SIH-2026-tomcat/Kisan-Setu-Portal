import { Request, Response } from 'express';
import { prisma } from '../config/db';

/**
 * Get Live Queue for a Centre on a specific date (or today)
 */
export async function getLiveQueue(req: Request, res: Response): Promise<void> {
  try {
    const centreId = String(req.params.centreId);
    const { date, tokenNumber } = req.query;

    const targetDate = typeof date === 'string' && date.length === 10
      ? date
      : new Date().toISOString().split('T')[0];

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      res.status(404).json({ success: false, message: 'Procurement centre not found.' });
      return;
    }

    // Get or create Queue entry for today
    let queue = await prisma.queue.findUnique({
      where: {
        centreId_date: {
          centreId,
          date: targetDate,
        },
      },
    });

    if (!queue) {
      queue = await prisma.queue.create({
        data: {
          centreId,
          date: targetDate,
          currentlyServing: 'A-001',
        },
      });
    }

    // Get today's bookings for this centre
    const bookings = await prisma.booking.findMany({
      where: {
        centreId,
        slot: { date: targetDate },
      },
      include: {
        farmer: true,
        slot: true,
      },
      orderBy: { tokenNumber: 'asc' },
    });

    const currentlyServing = queue.currentlyServing || 'A-001';

    // Parse numeric token index
    const parseTokenNum = (tok: string): number => {
      const match = tok.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const currentServingNum = parseTokenNum(currentlyServing);

    // Calculate queue statistics
    let farmersAhead = 0;
    let estimatedWaitMinutes = 0;
    let expectedTurnTime = '';
    let advisoryNotice = 'Please check queue updates periodically.';

    if (tokenNumber && typeof tokenNumber === 'string') {
      const myTokenNum = parseTokenNum(tokenNumber);
      farmersAhead = Math.max(0, myTokenNum - currentServingNum);
      estimatedWaitMinutes = farmersAhead * 4; // ~4 minutes per farmer

      const now = new Date();
      now.setMinutes(now.getMinutes() + estimatedWaitMinutes);
      expectedTurnTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (farmersAhead > 5) {
        advisoryNotice = 'You can wait safely before travelling to the centre.';
      } else if (farmersAhead >= 3) {
        advisoryNotice = 'Your turn is approaching. Prepare your produce for transport.';
      } else if (farmersAhead >= 1) {
        advisoryNotice = 'Please proceed to the procurement centre.';
      } else {
        advisoryNotice = 'Please report to the procurement counter immediately.';
      }
    }

    // Queue list formatted for frontend display
    const queueList = bookings.map((b) => {
      const bNum = parseTokenNum(b.tokenNumber);
      let statusLabel = 'Waiting';
      if (b.tokenNumber === currentlyServing) {
        statusLabel = 'Serving';
      } else if (bNum < currentServingNum || b.status === 'COMPLETED') {
        statusLabel = 'Completed';
      } else if (b.status === 'ARRIVED') {
        statusLabel = 'Arrived';
      }

      return {
        tokenNumber: b.tokenNumber,
        farmerName: b.farmer?.fullName || 'Farmer',
        cropType: b.cropType,
        quantity: b.expectedQuantity,
        timeSlot: b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '09:00–10:00',
        status: statusLabel,
        isCurrentlyServing: b.tokenNumber === currentlyServing,
      };
    });

    res.status(200).json({
      success: true,
      centre: {
        id: centre.id,
        name: centre.name,
        district: centre.district,
        address: centre.address,
      },
      date: targetDate,
      currentlyServing,
      farmersAhead,
      estimatedWaitMinutes,
      expectedTurnTime,
      advisoryNotice,
      totalWaitingToday: queueList.filter((q) => q.status === 'Waiting' || q.status === 'Arrived').length,
      totalServedToday: queueList.filter((q) => q.status === 'Completed').length,
      queueList,
      updatedAt: queue.updatedAt,
    });
  } catch (error) {
    console.error('getLiveQueue error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve live queue data.' });
  }
}
