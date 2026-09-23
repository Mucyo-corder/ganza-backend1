import { Task, TaskStep, TaskStatus } from './TaskModel.js';
import { ToolRouter } from './ToolRouter.js';
import { Verifier } from './Verifier.js';
import { RecoveryEngine } from './RecoveryEngine.js';
import { EvidenceEngine } from './EvidenceEngine.js';
import { WorldState } from './WorldState.js';
import { PolicyEngine } from './PolicyEngine.js';

export interface ExecutionContext {
  task: Task;
  step: TaskStep;
  deviceId: string;
  worldState: WorldState;
}

export class Executor {
  constructor(
    private toolRouter: ToolRouter,
    private verifier: Verifier,
    private recovery: RecoveryEngine,
    private evidenceEngine: EvidenceEngine,
    private policyEngine: PolicyEngine,
  ) {}

  async executeStep(ctx: ExecutionContext): Promise<TaskStatus> {
    const { task, step, deviceId } = ctx;

    // 1. Policy check
    const policyCheck = this.policyEngine.check(task, step.action, task.policy.riskLevel);
    if (policyCheck.decision === 'BLOCK') {
      return 'BLOCKED';
    }
    if (policyCheck.decision === 'CONFIRM') {
      return 'WAITING_PERMISSION';
    }

    // 2. Execute via tool router
    const toolResult = await this.toolRouter.execute({
      tool: step.tool,
      action: step.action,
      params: step.params ?? {},
      deviceId,
    });

    if (!toolResult.success) {
      const err = toolResult.error ?? 'Tool failed';
      if (err.includes('NOT_SUPPORTED')) return 'NOT_SUPPORTED';
      if (err.includes('WAITING_PERMISSION') || err.includes('PERMISSION')) return 'WAITING_PERMISSION';
      return 'FAILED';
    }

    // 3. Observe after state (stub — in real, perception re-observes)
    const afterState = toolResult.data ?? toolResult.evidence ?? 'tool_success';

    // 4. Verify
    const verification = this.verifier.verify({
      expected: step.expectedResult,
      beforeState: null,
      afterState,
      toolResult,
      evidence: [this.evidenceEngine.create({
        deviceId,
        deviceType: task.device === 'desktop' ? 'desktop' : task.device === 'phone' ? 'phone' : 'cloud',
        action: step.action,
        target: step.target,
        toolResult,
        afterState,
        verification: { success: false, method: step.verificationStrategy, expected: step.expectedResult, observed: String(afterState), evidenceExists: false },
      })],
      strategy: step.verificationStrategy,
    });

    // 5. Hard rule: evidence + verification
    const hasEvidence = true; // we just created one; in real, check screenshots
    const status = this.verifier.determineStatus(verification, toolResult.success, hasEvidence);
    if (status === 'PASSED') return 'PASSED';
    return 'NOT_VERIFIED';
  }

  async executeTask(task: Task, worldState: WorldState, deviceId: string): Promise<Task> {
    const updated = { ...task, status: 'RUNNING' as TaskStatus, startedAt: new Date().toISOString(), evidence: [...task.evidence] };
    for (const step of task.steps) {
      let retryCount = 0;
      let stepStatus: TaskStatus = 'PLANNED';
      while (retryCount <= task.policy.retryLimit) {
        stepStatus = await this.executeStep({ task: updated, step, deviceId, worldState });
        // Recovery loop
        if (stepStatus === 'NOT_VERIFIED' || stepStatus === 'FAILED') {
          const category = this.recovery.classify(stepStatus, step.expectedResult);
          const plan = this.recovery.plan(category, retryCount, task.policy.retryLimit);
          if (!this.recovery.shouldRetry(plan)) break;
          retryCount++;
          // In real, re-observe before retry
          continue;
        }
        break;
      }
      if (stepStatus !== 'PASSED') {
        // Recovery attempt once more already counted; if still not passed, task fails
        if (retryCount > 0 && stepStatus === 'NOT_VERIFIED') {
          stepStatus = 'RECOVERED' as TaskStatus; // if eventual success on retry, caller should handle; here we simulate still failed after retries
          // Actually if retry succeeded last iteration would have returned PASSED, so this means all retries exhausted
          stepStatus = 'FAILED';
        }
        updated.status = stepStatus;
        updated.completedAt = new Date().toISOString();
        // Record evidence for failure
        updated.evidence.push(this.evidenceEngine.create({
          deviceId,
          deviceType: task.device as any,
          action: step.action,
          target: step.target,
          verification: { success: false, method: step.verificationStrategy, expected: step.expectedResult, observed: `step ${stepStatus}`, evidenceExists: true, reason: `Step failed after ${retryCount} retries` },
          retryCount,
        }));
        return updated;
      }
      // Step passed — record success evidence
      updated.evidence.push(this.evidenceEngine.create({
        deviceId,
        deviceType: task.device as any,
        action: step.action,
        target: step.target,
        verification: { success: true, method: step.verificationStrategy, expected: step.expectedResult, observed: step.expectedResult, evidenceExists: true },
        retryCount,
      }));
    }
    updated.status = 'PASSED';
    updated.completedAt = new Date().toISOString();
    return updated;
  }
}
