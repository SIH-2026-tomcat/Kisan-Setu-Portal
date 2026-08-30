/**
 * Location, Distance & Recommendation Utilities for Kisan Setu
 */

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Rounded to 1 decimal place (e.g. 2.8 km)
}

/**
 * Checks if coordinates are valid numbers.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (lat !== 0 || lng !== 0)
  );
}

/**
 * Generates Google Maps Directions URL to destination.
 * Requires 0 API key and works natively on mobile apps or desktop browsers.
 * Requires ONLY procurement centre latitude/longitude.
 */
export function getGoogleMapsDirectionsUrl(
  lat?: number | null,
  lng?: number | null,
  address?: string | null,
  name?: string | null
): string | null {
  if (isValidCoordinate(lat, lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  // Fallback query search if coordinates are missing but name/address exists
  const cleanQuery = `${name || ''} ${address || ''}`.trim();
  if (cleanQuery.length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;
  }

  return null;
}

export interface CentreForRecommendation {
  id: string;
  distanceKm?: number | null;
  todayQueueCount?: number | null;
  nextAvailableSlotTime?: string | null;
}

/**
 * Distance & Congestion Based Recommendation Algorithm
 * Normalizes metrics first to ensure fair scoring across different numerical scales.
 * Formula:
 *   distanceScore = maxDist > 0 ? (distance / maxDist) : 0
 *   queueScore = maxQueue > 0 ? (queueCount / maxQueue) : 0
 *   score = (distanceScore * 0.6) + (queueScore * 0.4)
 * Lower score = better recommendation.
 */
export function findRecommendedCentreId<T extends CentreForRecommendation>(
  centres: T[]
): string | null {
  if (!centres || centres.length === 0) return null;

  const validDistances = centres
    .map((c) => (typeof c.distanceKm === 'number' && !isNaN(c.distanceKm) ? c.distanceKm : null))
    .filter((d): d is number => d !== null);

  const validQueues = centres
    .map((c) => (typeof c.todayQueueCount === 'number' && !isNaN(c.todayQueueCount) ? c.todayQueueCount : 0))
    .filter((q): q is number => typeof q === 'number' && !isNaN(q));

  const maxDist = validDistances.length > 0 ? Math.max(...validDistances, 1) : 0;
  const maxQueue = validQueues.length > 0 ? Math.max(...validQueues, 1) : 0;

  let bestCentreId: string | null = null;
  let minScore = Infinity;

  centres.forEach((centre) => {
    const dist = typeof centre.distanceKm === 'number' && !isNaN(centre.distanceKm) ? centre.distanceKm : null;
    const queue = typeof centre.todayQueueCount === 'number' && !isNaN(centre.todayQueueCount) ? centre.todayQueueCount : 0;

    // If farmer location is provided, compute normalized distance score; otherwise use 0
    const distanceScore = dist !== null && maxDist > 0 ? dist / maxDist : 0;
    const queueScore = maxQueue > 0 ? queue / maxQueue : 0;

    // Weight distance 60%, queue congestion 40%
    let score = dist !== null ? distanceScore * 0.6 + queueScore * 0.4 : queueScore * 1.0;

    // Safe handling: avoid NaN or Infinity
    if (isNaN(score)) score = 0;

    if (score < minScore) {
      minScore = score;
      bestCentreId = centre.id;
    }
  });

  return bestCentreId;
}
