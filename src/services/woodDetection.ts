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
  status: 'GOOD' | 'ACCEPTABLE' | 'NEEDS_REVIEW' | 'INVALID';
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
  const suppliedMetrics = image.width !== undefined || image.height !== undefined || image.blurScore !== undefined ||
    image.darknessScore !== undefined || image.glareScore !== undefined;
  const blurScore = image.blurScore;
  const darknessScore = image.darknessScore;
  const glareScore = image.glareScore;
  const occluded = Boolean(image.occluded);
  const overlapping = Boolean(image.overlapping);
  let status: ImageQualityAssessment['status'] = 'GOOD';

  if (image.mimeType && !image.mimeType.startsWith('image/')) {
    status = 'INVALID';
    issues.push('The selected file is not an image.');
  }

  if (image.size !== undefined && image.size <= 0) {
    status = 'INVALID';
    issues.push('The selected image is empty.');
  } else if (image.size !== undefined && image.size < 150000) {
    status = 'NEEDS_REVIEW';
    issues.push('File size is limited; image content still requires review.');
  }

  if ((image.width !== undefined && image.width < 64) || (image.height !== undefined && image.height < 64)) {
    status = 'INVALID';
    issues.push('The image resolution is too small to inspect.');
  }

  if (status === 'GOOD' && ((image.width !== undefined && image.width < 640) || (image.height !== undefined && image.height < 480))) {
    status = 'ACCEPTABLE';
    issues.push('Image resolution is limited; review the result.');
  }

  if (blurScore !== undefined && blurScore > 0.98 && darknessScore !== undefined && darknessScore > 0.98) {
    status = 'INVALID';
    issues.push('The image is extremely blurred and has no visible detail.');
  } else if (blurScore !== undefined && blurScore > 0.65) {
    status = status === 'INVALID' ? status : 'NEEDS_REVIEW';
    issues.push('Blur may reduce counting accuracy.');
  }

  if (darknessScore !== undefined && darknessScore > 0.7) {
    status = status === 'INVALID' ? status : 'NEEDS_REVIEW';
    issues.push('Low lighting may reduce counting accuracy.');
  }

  if (glareScore !== undefined && glareScore > 0.55) {
    status = status === 'INVALID' ? status : 'NEEDS_REVIEW';
    issues.push('Glare may reduce counting accuracy.');
  }

  if (occluded) {
    status = status === 'INVALID' ? status : 'NEEDS_REVIEW';
    issues.push('Some objects may be obscured; review the count.');
  }

  if (overlapping) {
    status = status === 'INVALID' ? status : 'NEEDS_REVIEW';
    issues.push('Touching objects may require manual count correction.');
  }

  if (!suppliedMetrics && status === 'GOOD') {
    status = 'NEEDS_REVIEW';
    issues.push('Photo quality metrics are unavailable; review the result.');
  }

  const score = clamp(
    100 - issues.length * 18 - ((blurScore ?? 0) * 20) - ((darknessScore ?? 0) * 20) - ((glareScore ?? 0) * 15),
    0,
    100
  );
  const isReliable = status === 'GOOD' || status === 'ACCEPTABLE';

  return {
    status,
    isReliable,
    score,
    confidence: Number((score / 100).toFixed(3)),
    issues,
    suggestedAction: status === 'INVALID'
      ? 'This file cannot be analyzed. Retake the photo or enter the count manually.'
      : 'Automatic counting is unavailable here. Enter or correct the count and measurements manually.',
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

    return {
      count: 0,
      confidence: quality.confidence,
      boards: [],
      quality,
      status: 'requires_confirmation',
      message: quality.suggestedAction,
    };
  }
}

export const woodDetectionService = new WoodDetectionService();
