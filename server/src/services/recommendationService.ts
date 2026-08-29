export interface SlotWithRecommendation {
  id: string;
  centreId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  availableCapacity: number;
  status: 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';
  isRecommended: boolean;
  congestionLevel: 'LOW' | 'MODERATE' | 'HIGH';
  estimatedWaitMinutes: number;
  recommendationReason?: string;
}

export function enhanceSlotsWithRecommendations(slots: Array<{
  id: string;
  centreId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}>): SlotWithRecommendation[] {
  if (slots.length === 0) return [];

  // Filter available slots
  const availableSlots = slots.filter((s) => s.bookedCount < s.capacity);

  // Find lowest booked count among available slots
  let lowestSlotId: string | null = null;
  if (availableSlots.length > 0) {
    const sorted = [...availableSlots].sort((a, b) => {
      const ratioA = a.bookedCount / a.capacity;
      const ratioB = b.bookedCount / b.capacity;
      if (ratioA !== ratioB) return ratioA - ratioB;
      return a.startTime.localeCompare(b.startTime);
    });
    lowestSlotId = sorted[0].id;
  }

  return slots.map((slot) => {
    const availableCapacity = Math.max(0, slot.capacity - slot.bookedCount);
    let status: 'AVAILABLE' | 'ALMOST_FULL' | 'FULL' = 'AVAILABLE';
    let congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';

    if (slot.bookedCount >= slot.capacity) {
      status = 'FULL';
      congestionLevel = 'HIGH';
    } else if (slot.bookedCount >= slot.capacity * 0.7) {
      status = 'ALMOST_FULL';
      congestionLevel = 'MODERATE';
    } else {
      status = 'AVAILABLE';
      congestionLevel = 'LOW';
    }

    const isRecommended = slot.id === lowestSlotId;
    const estimatedWaitMinutes = Math.max(8, slot.bookedCount * 4);

    return {
      ...slot,
      availableCapacity,
      status,
      isRecommended,
      congestionLevel,
      estimatedWaitMinutes,
      recommendationReason: isRecommended
        ? 'Recommended based on current lowest booking load and estimated minimum queue delay.'
        : undefined,
    };
  });
}
