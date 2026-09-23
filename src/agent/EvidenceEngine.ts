import { Evidence, Task, VerificationResult, DeviceType } from './TaskModel.js';

export interface RawEvidenceInput {
  deviceId: string;
  deviceType: DeviceType;
  action: string;
  target?: string;
  coordinate?: [number, number];
  beforeState?: unknown;
  toolResult?: unknown;
  afterState?: unknown;
  screenshotBefore?: string;
  screenshotAfter?: string;
  verification: VerificationResult;
  error?: string;
  retryCount?: number;
}

export class EvidenceEngine {
  create(input: RawEvidenceInput): Evidence {
    return {
      timestamp: new Date().toISOString(),
      deviceId: input.deviceId,
      deviceType: input.deviceType,
      action: input.action,
      target: input.target,
      coordinate: input.coordinate,
      beforeState: input.beforeState,
      toolResult: input.toolResult,
      afterState: input.afterState,
      verification: input.verification,
      screenshotBefore: input.screenshotBefore,
      screenshotAfter: input.screenshotAfter,
      error: input.error,
      retryCount: input.retryCount ?? 0,
    };
  }

  hasEvidence(evidence: Evidence[]): boolean {
    return evidence.length > 0 && evidence.some(e => e.screenshotAfter || e.afterState || e.toolResult);
  }

  /**
   * Evidence-based status check — mirrors Verifier hard rule
   */
  isEvidenceSufficient(task: Task): boolean {
    if (task.evidence.length === 0) return false;
    const last = task.evidence[task.evidence.length - 1];
    return last.verification.success && last.verification.evidenceExists;
  }

  toPersistable(evidence: Evidence) {
    return {
      ...evidence,
      // Do not persist huge screenshots inline in list views — caller decides
    };
  }
}
