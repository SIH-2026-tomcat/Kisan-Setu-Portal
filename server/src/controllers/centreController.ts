import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { enhanceSlotsWithRecommendations } from '../services/recommendationService';

/**
 * Get list of all procurement centres
 */
export async function getCentres(req: Request, res: Response): Promise<void> {
  try {
    const { district, search } = req.query;

    const where: any = { active: true };
    if (district && typeof district === 'string') {
      where.district = { equals: district };
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { district: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const centres = await prisma.procurementCentre.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Attach today's live queue status summary for each centre
    const today = new Date().toISOString().split('T')[0];
    const queues = await prisma.queue.findMany({
      where: { date: today },
    });
    const queueMap = new Map(queues.map((q) => [q.centreId, q.currentlyServing]));

    const enrichedCentres = centres.map((centre) => ({
      ...centre,
      currentlyServing: queueMap.get(centre.id) || 'Not Started',
      estimatedWaitTime: '15–20 mins',
    }));

    res.status(200).json({
      success: true,
      centres: enrichedCentres,
    });
  } catch (error) {
    console.error('getCentres error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve procurement centres.',
    });
  }
}

/**
 * Get single centre details
 */
export async function getCentreById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const centre = await prisma.procurementCentre.findUnique({
      where: { id },
    });

    if (!centre) {
      res.status(404).json({ success: false, message: 'Procurement centre not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const queue = await prisma.queue.findUnique({
      where: { centreId_date: { centreId: id, date: today } },
    });

    res.status(200).json({
      success: true,
      centre: {
        ...centre,
        currentlyServing: queue?.currentlyServing || 'A-001',
      },
    });
  } catch (error) {
    console.error('getCentreById error:', error);
    res.status(500).json({ success: false, message: 'Failed to get centre details.' });
  }
}

/**
 * Get slots for a centre on a given date with smart recommendation
 */
export async function getCentreSlots(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { date } = req.query;

    const targetDate = typeof date === 'string' && date.length === 10
      ? date
      : new Date().toISOString().split('T')[0];

    // Find or automatically ensure standard slots exist for the date
    let slots = await prisma.slot.findMany({
      where: {
        centreId: id,
        date: targetDate,
      },
      orderBy: { startTime: 'asc' },
    });

    // If slots not yet initialized for this day, create default schedule
    if (slots.length === 0) {
      const defaultTimes = [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '15:00' },
        { startTime: '15:00', endTime: '16:00' },
      ];

      for (const t of defaultTimes) {
        await prisma.slot.create({
          data: {
            centreId: id,
            date: targetDate,
            startTime: t.startTime,
            endTime: t.endTime,
            capacity: 10,
            bookedCount: 0,
          },
        });
      }

      slots = await prisma.slot.findMany({
        where: {
          centreId: id,
          date: targetDate,
        },
        orderBy: { startTime: 'asc' },
      });
    }

    // Enhance with Smart Recommendation Algorithm
    const enhancedSlots = enhanceSlotsWithRecommendations(slots);

    res.status(200).json({
      success: true,
      centreId: id,
      date: targetDate,
      slots: enhancedSlots,
    });
  } catch (error) {
    console.error('getCentreSlots error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve available slots.' });
  }
}
