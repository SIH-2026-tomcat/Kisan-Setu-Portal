/**
 * Quantity Conversion and Formatting Utility for Kisan Setu (Frontend)
 */

export type QuantityUnit = 'kg' | 'q';

export function toKilograms(quantity: number, unit: string = 'q'): number {
  const val = Number(quantity);
  if (isNaN(val) || val <= 0) return 0;
  const cleanUnit = (unit || 'q').toLowerCase().trim();
  if (cleanUnit === 'q' || cleanUnit === 'quintal' || cleanUnit === 'quintals') {
    return Math.round(val * 100 * 100) / 100;
  }
  return Math.round(val * 100) / 100;
}

export function fromKilograms(
  quantityKg: number,
  preferredUnit: string = 'q'
): {
  quantity: number;
  unitLabel: string;
  displayString: string;
  dualDisplay: string;
} {
  const kg = Math.round(quantityKg * 100) / 100;
  const q = Math.round((quantityKg / 100) * 100) / 100;
  const cleanUnit = (preferredUnit || 'q').toLowerCase().trim();

  if (cleanUnit === 'kg' || cleanUnit === 'kilogram' || cleanUnit === 'kilograms') {
    return {
      quantity: kg,
      unitLabel: 'kg',
      displayString: `${kg} kg`,
      dualDisplay: `${kg} kg (${q} Quintals)`,
    };
  }

  return {
    quantity: q,
    unitLabel: 'Quintals',
    displayString: `${q} Quintals`,
    dualDisplay: `${q} Quintals (${kg} kg)`,
  };
}

export function formatDualQuantity(
  quantityKg?: number | null,
  originalQuantity?: number | null,
  unit?: string | null
): string {
  if (typeof quantityKg !== 'number' || isNaN(quantityKg) || quantityKg <= 0) {
    if (typeof originalQuantity === 'number' && !isNaN(originalQuantity) && originalQuantity > 0) {
      const isKg = (unit || 'q').toLowerCase() === 'kg';
      const calcKg = isKg ? originalQuantity : originalQuantity * 100;
      return fromKilograms(calcKg, isKg ? 'kg' : 'q').dualDisplay;
    }
    return '0 kg';
  }

  const cleanUnit = (unit || 'q').toLowerCase();
  return fromKilograms(quantityKg, cleanUnit).dualDisplay;
}
