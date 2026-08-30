/**
 * Quantity Normalization & Conversion Utilities for Kisan Setu (Backend)
 * Indian agricultural conversion: 1 Quintal = 100 Kilograms
 */

export type QuantityUnit = 'kg' | 'q';

/**
 * Normalizes input quantity to Kilograms based on unit.
 * Rejects non-positive or invalid numeric values.
 */
export function toKilograms(quantity: number, unit: string = 'q'): number {
  const val = Number(quantity);
  if (isNaN(val) || val <= 0) {
    throw new Error('INVALID_QUANTITY');
  }
  const cleanUnit = (unit || 'q').toLowerCase().trim();
  if (cleanUnit === 'q' || cleanUnit === 'quintal' || cleanUnit === 'quintals') {
    return Math.round(val * 100 * 100) / 100;
  }
  return Math.round(val * 100) / 100;
}

/**
 * Converts Kilograms to farmer's preferred unit display formatting.
 */
export function formatQuantityFromKg(
  quantityKg: number,
  preferredUnit: string = 'q'
): {
  quantity: number;
  unit: 'kg' | 'q';
  displayString: string;
  dualDisplay: string;
} {
  const kg = Math.round(quantityKg * 100) / 100;
  const q = Math.round((quantityKg / 100) * 100) / 100;
  const cleanUnit = (preferredUnit || 'q').toLowerCase().trim();

  if (cleanUnit === 'kg' || cleanUnit === 'kilogram' || cleanUnit === 'kilograms') {
    return {
      quantity: kg,
      unit: 'kg',
      displayString: `${kg} kg`,
      dualDisplay: `${kg} kg (${q} Quintals)`,
    };
  }

  return {
    quantity: q,
    unit: 'q',
    displayString: `${q} Quintals`,
    dualDisplay: `${q} Quintals (${kg} kg)`,
  };
}
