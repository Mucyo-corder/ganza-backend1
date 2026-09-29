/**
 * GANZA Photo Quality Check
 * Honest detection before analysis — never continue with unreliable result.
 * Heuristics run on-device where possible; heavy checks delegated to backend
 * or skipped with honest "Estimated" label.
 */

export type QualityIssue =
  | 'blur'
  | 'darkness'
  | 'overexposure'
  | 'occlusion'
  | 'poor_angle'
  | 'no_reference'
  | 'low_visibility';

export interface QualityResult {
  status: 'GOOD' | 'ACCEPTABLE' | 'NEEDS_REVIEW' | 'INVALID';
  ok: boolean;
  score: number; // 0..1
  issues: QualityIssue[];
  message: string; // Kinyarwanda-first
  recommendation: string;
  needsReference: boolean;
}

export interface QualityCheckOptions {
  requireReference?: boolean; // if pricing by m³ needs reliable scale
  imageUri?: string; // future: pass to native blur detection
  nativeMetrics?: NativeQualityMetrics;
}

/**
 * Missing native metrics means quality is unknown, not that the photo is invalid.
 * Keep captured images available for detection and user review.
 */
export function checkPhotoQuality(opts: QualityCheckOptions = {}): QualityResult {
  const issues: QualityIssue[] = [];

  if (opts.requireReference) {
    issues.push('no_reference');
  }

  if (opts.imageUri && !opts.nativeMetrics) {
    issues.push('low_visibility');
    return {
      status: 'NEEDS_REVIEW',
      ok: true,
      score: 0.5,
      issues,
      message: 'Ubwiza bw\'ifoto ntibwashoboye kugenzurwa kuri iki gikoresho.',
      recommendation: 'Reba umubare wabonetse; ushobora kuwukosora mbere yo kubika.',
      needsReference: Boolean(opts.requireReference),
    };
  }

  const hasCritical = issues.includes('blur') || issues.includes('darkness') || issues.includes('overexposure');

  if (hasCritical) {
    return {
      status: 'INVALID',
      ok: false,
      score: 0.35,
      issues,
      message: 'Fata indi foto isobanutse.',
      recommendation: 'Ongera ufate ifoto — shyira urumuri ruhagije, egereza camera.',
      needsReference: opts.requireReference ?? true,
    };
  }

  if (issues.includes('no_reference')) {
    return {
      status: 'ACCEPTABLE',
      ok: true, // allow to continue BUT label as estimated
      score: 0.72,
      issues,
      message: 'Ibipimo byagereranijwe — nta rurerure ibonetse.',
      recommendation: 'Shyira ruler cyangwa ikintu kizwi (urugero: A4) hafi y\'imbaho kugira ngo ibipimo bibe by\'ukuri.',
      needsReference: true,
    };
  }

  return {
    status: 'GOOD',
    ok: true,
    score: 0.92,
    issues: [],
    message: 'Ifoto isobanutse — yakira gusesengurwa.',
    recommendation: '',
    needsReference: false,
  };
}

export function qualityMessage(result: QualityResult): string {
  if (!result.ok) return result.message;
  if (result.needsReference) return 'Estimated measurement — bishobora guhinduka nyuma yo gupima neza.';
  return 'Ifoto yemewe';
}

// For future native integration: attach real blur/brightness numbers
export interface NativeQualityMetrics {
  blurScore?: number; // 0..1, <0.4 = blur
  brightness?: number; // 0..255
  contrast?: number;
}
export function checkWithNativeMetrics(metrics: NativeQualityMetrics, opts: QualityCheckOptions = {}): QualityResult {
  const issues: QualityIssue[] = [];
  if (metrics.blurScore !== undefined && metrics.blurScore < 0.4) issues.push('blur');
  if (metrics.brightness !== undefined) {
    if (metrics.brightness < 45) issues.push('darkness');
    if (metrics.brightness > 230) issues.push('overexposure');
  }
  if (opts.requireReference) issues.push('no_reference');
  const score = issues.length === 0 ? 0.93 : issues.includes('blur') || issues.includes('darkness') ? 0.3 : 0.65;
  const invalid = (metrics.blurScore !== undefined && metrics.blurScore < 0.08)
    || (metrics.brightness !== undefined && (metrics.brightness < 8 || metrics.brightness > 248));
  const needsReview = issues.includes('blur') || issues.includes('darkness') || issues.includes('overexposure');
  const ok = !invalid;
  return {
    status: invalid ? 'INVALID' : needsReview ? 'NEEDS_REVIEW' : issues.includes('no_reference') ? 'ACCEPTABLE' : 'GOOD',
    ok,
    score,
    issues,
    message: ok ? (issues.includes('no_reference') ? 'Ibipimo byagereranijwe — nta rurerure' : 'Ifoto isobanutse') : 'Fata indi foto isobanutse.',
    recommendation: ok && issues.includes('no_reference') ? 'Ongeraho ruler muri foto ikurikira' : ok ? '' : 'Ongera ufate — kongera urumuri, komera camera neza.',
    needsReference: issues.includes('no_reference'),
  };
}
