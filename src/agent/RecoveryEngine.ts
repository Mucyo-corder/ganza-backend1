export type FailureCategory =
  | 'UI_CHANGED'
  | 'ELEMENT_NOT_FOUND'
  | 'POPUP_BLOCKED'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'APP_CRASH'
  | 'TIMEOUT'
  | 'WRONG_STATE'
  | 'INVALID_MODEL_OUTPUT'
  | 'UNKNOWN';

export interface RecoveryPlan {
  category: FailureCategory;
  retry: boolean;
  alternativeAction?: string;
  maxRetries: number;
}

export class RecoveryEngine {
  classify(error: unknown, verificationReason?: string): FailureCategory {
    const msg = String(error ?? verificationReason ?? '').toLowerCase();
    if (msg.includes('permission') || msg.includes('waiving_permission')) return 'PERMISSION_DENIED';
    if (msg.includes('popup') || msg.includes('dialog')) return 'POPUP_BLOCKED';
    if (msg.includes('network') || msg.includes('timeout')) return 'TIMEOUT';
    if (msg.includes('not_found') || msg.includes('not found') || msg.includes('element')) return 'ELEMENT_NOT_FOUND';
    if (msg.includes('ui changed') || msg.includes('state mismatch')) return 'UI_CHANGED';
    if (msg.includes('crash') || msg.includes('exception')) return 'APP_CRASH';
    if (msg.includes('invalid') && msg.includes('model')) return 'INVALID_MODEL_OUTPUT';
    if (msg.includes('wrong_state')) return 'WRONG_STATE';
    return 'UNKNOWN';
  }

  plan(category: FailureCategory, retryCount: number, retryLimit: number): RecoveryPlan {
    if (retryCount >= retryLimit) {
      return { category, retry: false, maxRetries: retryLimit };
    }
    switch (category) {
      case 'POPUP_BLOCKED':
        return { category, retry: true, alternativeAction: 'dismiss_popup_and_retry', maxRetries: retryLimit };
      case 'ELEMENT_NOT_FOUND':
        return { category, retry: true, alternativeAction: 're_observe_and_replan', maxRetries: retryLimit };
      case 'UI_CHANGED':
        return { category, retry: true, alternativeAction: 're_observe_and_replan', maxRetries: retryLimit };
      case 'TIMEOUT':
        return { category, retry: true, alternativeAction: 'wait_and_retry', maxRetries: retryLimit };
      case 'PERMISSION_DENIED':
        return { category, retry: false, maxRetries: retryLimit };
      case 'INVALID_MODEL_OUTPUT':
        return { category, retry: true, alternativeAction: 'repair_and_retry', maxRetries: Math.min(retryLimit, 2) };
      default:
        return { category, retry: retryCount < 1, maxRetries: retryLimit };
    }
  }

  shouldRetry(plan: RecoveryPlan): boolean {
    return plan.retry;
  }
}
