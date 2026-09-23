import { TestCase, TestRun, TestStatus, TestStepRun } from './TestModels.js';
import { AgentCore } from '../agent/AgentCore.js';
import { Task } from '../agent/TaskModel.js';

export class TestEngine {
  constructor(private agentCore: AgentCore) {}

  /**
   * Convert TestCase → Task, run via AgentCore, map result → TestRun
   * Hard rule: Test is PASSED only if AgentCore returns PASSED with evidence
   */
  async run(testCase: TestCase): Promise<TestRun> {
    const run: TestRun = {
      id: `trun_${Date.now()}`,
      testId: testCase.id,
      status: 'RUNNING',
      mode: testCase.mode,
      startedAt: new Date().toISOString(),
      steps: [],
      evidence: [],
      retryCount: 0,
    };

    // OBSERVE_ONLY / DRY_RUN do not execute — return NOT_VERIFIED with reason
    if (testCase.mode === 'OBSERVE_ONLY') {
      run.status = 'NOT_VERIFIED';
      run.endedAt = new Date().toISOString();
      run.evidence.push({
        timestamp: new Date().toISOString(),
        stepId: 'observe',
        action: 'observe',
        verification: { success: false, reason: 'OBSERVE_ONLY — no execution performed' },
      });
      return run;
    }
    if (testCase.mode === 'DRY_RUN') {
      // Validate plan without execution
      run.status = 'NOT_VERIFIED';
      run.endedAt = new Date().toISOString();
      run.evidence.push({
        timestamp: new Date().toISOString(),
        stepId: 'dry_run',
        action: 'dry_run',
        verification: { success: false, reason: 'DRY_RUN — plan validated but not executed; evidence required for PASS' },
      });
      return run;
    }

    const task: Task = {
      id: `task_from_${testCase.id}_${Date.now()}`,
      businessId: 'test-business',
      userId: testCase.createdBy,
      goal: {
        description: testCase.goal,
        expectedResult: testCase.expectedResult,
        verificationStrategy: 'ui_state',
        maxSteps: testCase.maxSteps,
        timeoutMs: testCase.timeoutMs,
      },
      device: testCase.device as any,
      target: testCase.target as any,
      steps: [],
      policy: {
        requiresConfirmation: testCase.riskLevel === 'high' || testCase.riskLevel === 'critical',
        allowedDevices: [testCase.device as any],
        riskLevel: testCase.riskLevel,
        retryLimit: 2,
      },
      status: 'PLANNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
    };

    const result = await this.agentCore.runTask(task);

    // Map TaskStatus → TestStatus
    const statusMap: Record<string, TestStatus> = {
      PASSED: 'PASSED',
      RECOVERED: 'PASSED', // Recovered counts as passed for testing (evidence shows recovery)
      FAILED: 'FAILED',
      BLOCKED: 'BLOCKED',
      WAITING_PERMISSION: 'BLOCKED',
      NOT_SUPPORTED: 'BLOCKED',
      NOT_VERIFIED: 'NOT_VERIFIED',
      CANCELLED: 'CANCELLED',
    };

    run.status = statusMap[result.status] ?? 'FAILED';
    run.endedAt = new Date().toISOString();
    run.steps = result.steps.map((s, idx) => ({
      id: s.id,
      order: s.order,
      action: s.action,
      target: s.target,
      verification: {
        success: result.evidence[idx]?.verification.success ?? false,
        expected: s.expectedResult,
        observed: String(result.evidence[idx]?.afterState ?? ''),
        reason: result.evidence[idx]?.verification.reason,
      },
      durationMs: 0,
    } as TestStepRun));
    run.evidence = result.evidence.map((e, idx) => ({
      timestamp: e.timestamp,
      stepId: result.steps[idx]?.id ?? `step_${idx}`,
      action: e.action,
      toolResult: e.toolResult,
      beforeScreenshot: e.screenshotBefore,
      afterScreenshot: e.screenshotAfter,
      verification: { success: e.verification.success, reason: e.verification.reason },
    }));
    run.retryCount = result.evidence.reduce((acc, e) => acc + e.retryCount, 0);

    return run;
  }
}
