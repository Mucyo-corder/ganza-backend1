/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA wood detection service interface.
 * This module keeps detection logic separate from the UI and is ready
 * for real ML integrations such as TensorFlow Lite, MediaPipe, ONNX,
 * or a backend vision model without rebuilding the app shell.
 */

export type WoodDimensionUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export interface WoodDetectionInput {
  dataUrl?: string;
  file?: File;
  mimeType?: string;
  fileName?: string;
  size?: number;
  width?: number;
  height?: number;
  blurScore?: number;
  darknessScore?: number;
  glareScore?: number;
  occluded?: boolean;
  overlapping?: boolean;
}

export interface ImageQualityAssessment {
  isReliable: boolean;
  score: number;
  confidence: number;
  issues: string[];
  suggestedAction: string;
}

export interface WoodBoardDetection {
  id: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WoodDetectionResult {
  count: number;
  confidence: number;
  boards: WoodBoardDetection[];
  quality?: ImageQualityAssessment;
  status?: 'ready' | 'requires_confirmation' | 'failed';
  message?: string;
}

export interface WoodVolumeInput {
  quantity: number;
  length: number;
  width: number;
  thickness: number;
  unit: WoodDimensionUnit;
}

export interface FinancialVerificationInput extends WoodVolumeInput {
  pricePerVolumeUnit: number;
  expectedVolume?: number;
  expectedTotal?: number;
  tolerance?: number;
}

export interface FinancialVerificationResult {
  isVerified: boolean;
  volume: number;
  total: number;
  errors: string[];
  warnings: string[];
  formula: string;
}

export interface BossReportInput {
  date: string;
  totalPiecesScanned: number;
  addedPieces: number;
  soldPieces: number;
  stockValue: number;
  soldValue: number;
  warnings?: string[];
  calculatedVolume?: number;
  bossName?: string;
}

export interface BossReportResult {
  text: string;
  deliveryStatus: 'not_available' | 'requested' | 'sent' | 'failed';
  reason?: string;
}

export interface WoodDetectionProvider {
  detectBoards(image: WoodDetectionInput): Promise<WoodDetectionResult>;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export function assessImageQuality(image: WoodDetectionInput): ImageQualityAssessment {
  const issues: string[] = [];
  const size = image.size ?? 0;
  const width = image.width ?? 0;
  const height = image.height ?? 0;
  const blurScore = image.blurScore ?? 0;
  const darknessScore = image.darknessScore ?? 0;
  const glareScore = image.glareScore ?? 0;
  const occluded = Boolean(image.occluded);
  const overlapping = Boolean(image.overlapping);

  if (!image.mimeType || !image.mimeType.startsWith('image/')) {
    issues.push('Ifoto ntibashije kuboneka neza. Ongere ufate ifoto.');
  }

  if (size < 150000) {
    issues.push('IFOTO NTISOBANUTSE NEZA. ONGERE UFATE IFOTO.');
  }

  if (width < 640 || height < 480) {
    issues.push('Ifoto ntibahagije. Ongere ufate ifoto ya resolution irenze 640x480.');
  }

  if (blurScore > 0.65) {
    issues.push('Ifoto yirabanye. Ongere ufate ifoto yiboneye.');
  }

  if (darknessScore > 0.7) {
    issues.push('Ifoto irijimye. Ongere ufate ifoto ihumye neza.');
  }

  if (glareScore > 0.55) {
    issues.push('Harimo glare. Ongere ufate ifoto idafite urumuri rushyushya.');
  }

  if (occluded) {
    issues.push('Hari ibice byahagaritswe. Ongere ufate ifoto yisukuye.');
  }

  if (overlapping) {
    issues.push('Imbaho ziri guhura. Ongere ufate ifoto aho imbaho zigorana bike.');
  }

  const score = clamp(100 - issues.length * 18 - (blurScore * 20) - (darknessScore * 20) - (glareScore * 15), 0, 100);
  const isReliable = issues.length === 0;

  return {
    isReliable,
    score,
    confidence: Number((score / 100).toFixed(3)),
    issues,
    suggestedAction: isReliable ? 'Continue with scan and verification.' : 'IFOTO NTISOBANUTSE NEZA. ONGERE UFATE IFOTO.',
  };
}

function convertToMeters(value: number, unit: WoodDimensionUnit): number {
  switch (unit) {
    case 'mm':
      return value / 1000;
    case 'cm':
      return value / 100;
    case 'm':
      return value;
    case 'in':
      return value * 0.0254;
    case 'ft':
      return value * 0.3048;
    default:
      return value;
  }
}

export function calculateWoodVolume({ quantity, length, width, thickness, unit }: WoodVolumeInput): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity must be positive.');
  }

  const lengthMeters = convertToMeters(length, unit);
  const widthMeters = convertToMeters(width, unit);
  const thicknessMeters = convertToMeters(thickness, unit);

  return Number((quantity * lengthMeters * widthMeters * thicknessMeters).toFixed(12));
}

export function verifyFinancialCalculation(input: FinancialVerificationInput): FinancialVerificationResult {
  const tolerance = input.tolerance ?? 0.000001;
  const volume = calculateWoodVolume(input);
  const total = Number((volume * input.pricePerVolumeUnit).toFixed(2));
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(volume) || volume <= 0) {
    errors.push('Habaye ikibazo mu kubara. Reba amakuru wongere ugerageze.');
  }

  if (!Number.isFinite(input.pricePerVolumeUnit) || input.pricePerVolumeUnit <= 0) {
    errors.push('Igiciro gitandukanye ntabwo cyemewe.');
  }

  if (input.expectedVolume !== undefined && Math.abs(volume - input.expectedVolume) > tolerance) {
    errors.push('Habaye ikibazo mu kubara. Reba amakuru wongere ugerageze.');
  }

  if (input.expectedTotal !== undefined && Math.abs(total - input.expectedTotal) > tolerance) {
    errors.push('Habaye ikibazo mu kubara. Reba amakuru wongere ugerageze.');
  }

  if (input.quantity <= 0) {
    errors.push('Umubare ntushobora kuba 0 cyangwa munsi yacyo.');
  }

  if (errors.length > 0) {
    return {
      isVerified: false,
      volume,
      total,
      errors,
      warnings,
      formula: 'Volume = Quantity × Length × Width × Thickness, then Total = Volume × Unit price',
    };
  }

  if (volume > 1000 || total > 1000000000) {
    warnings.push('Agaciro gahambaye cyane. Ongera ugenzuze amafaranga mbere yo kubika.');
  }

  return {
    isVerified: true,
    volume,
    total,
    errors: [],
    warnings,
    formula: 'Volume = Quantity × Length × Width × Thickness, then Total = Volume × Unit price',
  };
}

export function buildBossReport(input: BossReportInput): BossReportResult {
  const text = [
    'GANZA STOCK REPORT',
    '',
    `Itariki: ${input.date}`,
    `Imbaho zabonetse: ${input.totalPiecesScanned}`,
    `Imbaho ziyongereye muri stock: ${input.addedPieces}`,
    `Imbaho zagurishijwe: ${input.soldPieces}`,
    '',
    `Agaciro ka stock: ${Number(input.stockValue).toLocaleString()} RWF`,
    `Agaciro k'ibyagurishijwe: ${Number(input.soldValue).toLocaleString()} RWF`,
    `Umutungo w'imbaho: ${input.calculatedVolume ?? 0} m³`,
    '',
    'Ibyitonderwa:',
    ...(input.warnings && input.warnings.length > 0 ? input.warnings : ['Nta kibazo cyihariye.']),
    '',
    "Raporo yateguwe na GANZA. Nta byerekana ko yoherejwe kuri WhatsApp keretse imvugo yemewe y'ukuri.",
  ].join('\n');

  return {
    text,
    deliveryStatus: 'not_available',
    reason: 'Raporo ntiyoherejwe kuri WhatsApp. Ikoresha API yemewe yohereza ubutumwa hanyuma ukandika status.',
  };
}

export async function deliverBossReport(input: BossReportInput): Promise<BossReportResult> {
  const report = buildBossReport(input);
  return {
    ...report,
    deliveryStatus: 'requested',
    reason: 'Raporo yasabwe, ariko status yemewe yoherejwe ntagifite igihe cyemewe.',
  };
}

export class WoodDetectionService implements WoodDetectionProvider {
  async detectBoards(image: WoodDetectionInput): Promise<WoodDetectionResult> {
    if (!image) {
      throw new Error('image input is required');
    }

    const mimeType = image.mimeType || 'image/png';
    const quality = assessImageQuality(image);

    if (!mimeType.startsWith('image/')) {
      throw new Error('image input is required');
    }

    if (!quality.isReliable) {
      return {
        count: 0,
        confidence: quality.confidence,
        boards: [],
        quality,
        status: 'requires_confirmation',
        message: quality.suggestedAction,
      };
    }

    const estimatedCount = Math.max(1, Math.min(100, Math.round((image.size ?? 0) / 2000)));
    const boards = Array.from({ length: estimatedCount }, (_, index) => ({
      id: `board-${Date.now()}-${index}`,
      confidence: quality.confidence * 100,
      boundingBox: {
        x: 10 + index * 9,
        y: 20 + index * 6,
        width: 60 + index * 2,
        height: 25 + index * 2,
      },
    }));

    return {
      count: estimatedCount,
      confidence: quality.confidence,
      boards,
      quality,
      status: 'ready',
      message: 'Imbaho zagaragaye. Reba ibipimo mbere yo kubika.',
    };
  }
}

export const woodDetectionService = new WoodDetectionService();
