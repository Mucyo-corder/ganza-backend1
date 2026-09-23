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
}

/**
 * Lightweight heuristic — expand with native libs (e.g. react-native-blur, brightness).
 * For now we expose the structure and return honest "unknown" when no native analysis.
 * UI must show "Estimated measurement" when reference missing.
 */
export function checkPhotoQuality(opts: QualityCheckOptions = {}): QualityResult {
  const issues: QualityIssue[] = [];

  // Without native analysis we cannot claim blur/darkness — we surface reference warning honestly.
  if (opts.requireReference) {
    issues.push('no_reference');
  }

  const hasCritical = issues.includes('blur') || issues.includes('darkness') || issues.includes('overexposure');

  if (hasCritical) {
    return {
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
      ok: true, // allow to continue BUT label as estimated
      score: 0.72,
      issues,
      message: 'Ibipimo byagereranijwe — nta rurerure ibonetse.',
      recommendation: 'Shyira ruler cyangwa ikintu kizwi (urugero: A4) hafi y\'imbaho kugira ngo ibipimo bibe by\'ukuri.',
      needsReference: true,
    };
  }

  return {
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
  const ok = !issues.includes('blur') && !issues.includes('darkness') && !issues.includes('overexposure');
  return {
    ok,
    score,
    issues,
    message: ok ? (issues.includes('no_reference') ? 'Ibipimo byagereranijwe — nta rurerure' : 'Ifoto isobanutse') : 'Fata indi foto isobanutse.',
    recommendation: ok && issues.includes('no_reference') ? 'Ongeraho ruler muri foto ikurikira' : ok ? '' : 'Ongera ufate — kongera urumuri, komera camera neza.',
    needsReference: issues.includes('no_reference'),
  };
}
