import { PriceBasis } from './woodMath';

export interface PriceConfig {
  basis: PriceBasis; // how this price is quoted
  valuePerUnit: number; // RWF per unit (per piece / per m / per m2 / per m3)
  woodType?: string; // optional filter
  grade?: string;
}

export interface PricingResult {
  totalRWF: number;
  basis: PriceBasis;
  unitPrice: number;
  quantityLabel: string;
  formula: string; // explicit for review screen
}

/**
 * Calculate estimated value honoring basis.
 * Never mix units silently.
 */
export function calculatePrice(
  config: PriceConfig,
  metrics: { pieces: number; totalLengthM: number; totalAreaM2: number; totalVolumeM3: number }
): PricingResult {
  if (!Number.isFinite(config.valuePerUnit) || config.valuePerUnit <= 0) {
    throw new Error('Unit price must be greater than zero');
  }
  if (![metrics.pieces, metrics.totalLengthM, metrics.totalAreaM2, metrics.totalVolumeM3].every(value => Number.isFinite(value) && value >= 0)) {
    throw new Error('Calculated quantities must be finite and non-negative');
  }
  let total = 0;
  let formula = '';
  if (config.basis === 'piece') {
    total = metrics.pieces * config.valuePerUnit;
    formula = `${metrics.pieces} × ${config.valuePerUnit.toLocaleString()} RWF / pc`;
  } else if (config.basis === 'm') {
    total = metrics.totalLengthM * config.valuePerUnit;
    formula = `${metrics.totalLengthM.toFixed(2)} m × ${config.valuePerUnit.toLocaleString()} RWF / m`;
  } else if (config.basis === 'm2') {
    total = metrics.totalAreaM2 * config.valuePerUnit;
    formula = `${metrics.totalAreaM2.toFixed(2)} m² × ${config.valuePerUnit.toLocaleString()} RWF / m²`;
  } else if (config.basis === 'm3') {
    total = metrics.totalVolumeM3 * config.valuePerUnit;
    formula = `${metrics.totalVolumeM3.toFixed(3)} m³ × ${config.valuePerUnit.toLocaleString()} RWF / m³`;
  }
  return {
    totalRWF: Math.round(total),
    basis: config.basis,
    unitPrice: config.valuePerUnit,
    quantityLabel:
      config.basis === 'piece' ? `${metrics.pieces} imbaho` : config.basis === 'm' ? `${metrics.totalLengthM.toFixed(2)} m` : config.basis === 'm2' ? `${metrics.totalAreaM2.toFixed(2)} m²` : `${metrics.totalVolumeM3.toFixed(3)} m³`,
    formula,
  };
}

export function priceLabel(basis: PriceBasis): string {
  if (basis === 'piece') return 'RWF / pc';
  if (basis === 'm') return 'RWF / m';
  if (basis === 'm2') return 'RWF / m²';
  return 'RWF / m³';
}

export const DEFAULT_PRICE_CONFIG: PriceConfig = {
  basis: 'm3',
  valuePerUnit: 180000,
};

// woodType specific defaults could be loaded from Firebase pricing config
export const PRICE_PRESETS: PriceConfig[] = [
  { basis: 'm3', valuePerUnit: 180000 },
  { basis: 'piece', valuePerUnit: 8000 },
  { basis: 'm2', valuePerUnit: 12000 },
  { basis: 'm', valuePerUnit: 3500 },
];
