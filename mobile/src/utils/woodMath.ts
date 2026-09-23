/**
 * GANZA Calculation Engine — honest, explicit, unit-safe
 * All formulas are transparent and verifiable.
 * Stock owner can see exactly how numbers are derived.
 */

export type Unit = 'mm' | 'cm' | 'm';
export type PriceBasis = 'piece' | 'm' | 'm2' | 'm3';

export interface Dimensions {
  length: number; // meters
  width: number;  // meters
  thickness: number; // meters
  unit?: Unit; // original unit for display, defaults to m/cm
}

export interface WoodGroup {
  id: string;
  woodType: string;
  quantity: number;
  dimensions: Dimensions;
  confidence?: number;
  // how measurement was obtained
  measurementMethod: MeasurementMethod;
}

export type MeasurementMethod =
  | 'reference_ruler'
  | 'reference_object'
  | 'ar_depth'
  | 'manual'
  | 'estimated';

export const MEASUREMENT_LABEL: Record<MeasurementMethod, string> = {
  reference_ruler: 'Zapimwe na ruler',
  reference_object: 'Zapimwe na reference',
  ar_depth: 'Zapimwe na AR / depth',
  manual: 'Byinjijwe n\'ukoresha',
  estimated: 'Estimated measurement',
};

/**
 * Normalize any length to meters
 */
export function toMeters(value: number, unit: Unit): number {
  if (unit === 'mm') return value / 1000;
  if (unit === 'cm') return value / 100;
  return value;
}

export function fromMeters(valueM: number, unit: Unit): number {
  if (unit === 'mm') return valueM * 1000;
  if (unit === 'cm') return valueM * 100;
  return valueM;
}

/**
 * Volume for one piece: length × width × thickness (all in meters) = m³
 */
export function volumeOnePieceM3(d: Dimensions): number {
  return d.length * d.width * d.thickness;
}

/**
 * Group volume = one-piece volume × quantity
 */
export function volumeGroupM3(group: WoodGroup): number {
  return volumeOnePieceM3(group.dimensions) * group.quantity;
}

export function areaOnePieceM2(d: Dimensions): number {
  return d.length * d.width;
}

export function areaGroupM2(group: WoodGroup): number {
  return areaOnePieceM2(group.dimensions) * group.quantity;
}

export function totalLengthM(group: WoodGroup): number {
  return group.dimensions.length * group.quantity;
}

export function totalVolumeM3(groups: WoodGroup[]): number {
  return groups.reduce((sum, g) => sum + volumeGroupM3(g), 0);
}

export function totalAreaM2(groups: WoodGroup[]): number {
  return groups.reduce((sum, g) => sum + areaGroupM2(g), 0);
}

export function totalPieces(groups: WoodGroup[]): number {
  return groups.reduce((sum, g) => sum + g.quantity, 0);
}

/**
 * Group imbaho that share identical dimensions (within epsilon) and woodType
 */
export function groupByDimensions(
  imbaho: Array<{ woodType: string; dimensions: Dimensions; measurementMethod?: MeasurementMethod }>,
  epsilon = 0.005 // 5mm tolerance
): WoodGroup[] {
  const groups: WoodGroup[] = [];
  for (const p of imbaho) {
    const found = groups.find(
      g =>
        g.woodType === p.woodType &&
        Math.abs(g.dimensions.length - p.dimensions.length) < epsilon &&
        Math.abs(g.dimensions.width - p.dimensions.width) < epsilon &&
        Math.abs(g.dimensions.thickness - p.dimensions.thickness) < epsilon
    );
    if (found) {
      found.quantity += 1;
    } else {
      groups.push({
        id: `grp_${Date.now()}_${groups.length}_${Math.random().toString(36).slice(2, 6)}`,
        woodType: p.woodType,
        quantity: 1,
        dimensions: { ...p.dimensions },
        measurementMethod: p.measurementMethod || 'estimated',
      });
    }
  }
  return groups;
}

export function formatDimensions(d: Dimensions): string {
  // Show as m × m × m, or if small convert to cm for readability but keep m in calculation
  // Spec example: 3.0 × 0.20 × 0.05 m
  const l = d.length.toFixed(2).replace(/\.00$/, '.0').replace(/0$/, '');
  // Actually keep clean: 3.0, 0.20
  return `${d.length.toFixed(1)} × ${d.width.toFixed(2)} × ${d.thickness.toFixed(2)} m`;
  // alternative compact: `${(d.length).toFixed(1)}m × ${(d.width*100).toFixed(0)}cm × ${(d.thickness*100).toFixed(0)}cm`
}

export function formatVolume(m3: number): string {
  if (m3 < 0.001) return `${(m3 * 1_000_000).toFixed(0)} cm³`;
  if (m3 < 1) return `${m3.toFixed(3)} m³`;
  return `${m3.toFixed(2)} m³`;
}

export function formatArea(m2: number): string {
  return `${m2.toFixed(2)} m²`;
}

/**
 * Validate dimensions — never mix units silently
 */
export function validateDimensions(d: Dimensions): string | null {
  if (d.length <= 0 || d.width <= 0 || d.thickness <= 0) return 'Ibipimo bigomba kuba > 0';
  if (!isFinite(d.length) || !isFinite(d.width) || !isFinite(d.thickness)) return 'Ibipimo ntibisobanutse';
  if (d.length > 12) return 'Uburebure burenze 12m — reba unit';
  return null;
}
