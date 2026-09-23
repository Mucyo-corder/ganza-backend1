import { Evidence, VerificationResult, VerificationStrategy } from './TaskModel.js';

/**
 * Verification Engine — NO FALSE CLAIMS
 * Success requires:
 *  execution_result == success
 *  AND verification == success
 *  AND evidence exists
 */
export class Verifier {
  verify(params: {
    expected: string;
    beforeState: unknown;
    afterState: unknown;
    toolResult: unknown;
    evidence: Evidence[];
    strategy: VerificationStrategy;
  }): VerificationResult {
    const { expected, afterState, toolResult, evidence, strategy } = params;

    // Must have evidence
    if (!evidence || evidence.length === 0) {
      return {
        success: false,
        method: strategy,
        expected,
        observed: 'NO_EVIDENCE',
        evidenceExists: false,
        reason: 'No evidence captured — cannot claim success',
      };
    }

    // Tool must have succeeded
    const toolSuccess = this.isToolSuccess(toolResult);
    if (!toolSuccess) {
      return {
        success: false,
        method: strategy,
        expected,
        observed: String(afterState ?? toolResult),
        evidenceExists: true,
        reason: 'Tool result indicates failure',
      };
    }

    // Verify expected state vs observed
    const verified = this.compareExpectedVsObserved(expected, afterState, strategy);
    if (!verified) {
      return {
        success: false,
        method: strategy,
        expected,
        observed: String(afterState),
        evidenceExists: true,
        reason: `Expected "${expected}" not observed in after_state`,
      };
    }

    return {
      success: true,
      method: strategy,
      expected,
      observed: String(afterState),
      evidenceExists: true,
    };
  }

  private isToolSuccess(result: unknown): boolean {
    if (result === null || result === undefined) return false;
    if (typeof result === 'object' && result !== null) {
      const r = result as Record<string, unknown>;
      if ('success' in r) return Boolean(r.success);
      if ('status' in r) return r.status === 'success' || r.status === 'ok';
      if ('error' in r && r.error) return false;
    }
    if (typeof result === 'boolean') return result;
    // For file/browser actions, truthy result considered success — but must still pass evidence check
    return true;
  }

  private compareExpectedVsObserved(expected: string, observed: unknown, strategy: VerificationStrategy): boolean {
    if (!expected) return true;
    if (!observed) return false;
    const obsStr = typeof observed === 'string' ? observed : JSON.stringify(observed);
    const expLower = expected.toLowerCase();
    const obsLower = obsStr.toLowerCase();

    switch (strategy) {
      case 'ui_state':
      case 'ocr':
      case 'dom':
        // Fuzzy contains check — expected text should appear in observed
        return obsLower.includes(expLower) || expLower.includes(obsLower);
      case 'file_exists':
        return obsLower.includes('exists') || obsLower.includes(expLower);
      case 'tool_result':
        return obsLower.includes(expLower);
      case 'notification':
        return obsLower.includes(expLower);
      default:
        return obsLower.includes(expLower);
    }
  }

  /**
   * Final status determination — hard rule
   */
  determineStatus(verification: VerificationResult, toolSuccess: boolean, evidenceExists: boolean): 'PASSED' | 'NOT_VERIFIED' | 'FAILED' {
    if (!toolSuccess) return 'FAILED';
    if (!evidenceExists) return 'NOT_VERIFIED';
    if (!verification.success) return 'NOT_VERIFIED';
    return 'PASSED';
  }
}
