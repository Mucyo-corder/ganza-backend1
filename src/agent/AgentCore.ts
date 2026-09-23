import { Task, TaskStatus } from './TaskModel.js';
import { WorldState } from './WorldState.js';
import { Planner } from './Planner.js';
import { Executor } from './Executor.js';
import { Verifier } from './Verifier.js';
import { PolicyEngine } from './PolicyEngine.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { ReportEngine } from '../reports/ReportEngine.js';
import { EventBus } from '../events/EventBus.js';
import { DeviceRegistry } from '../devices/DeviceRegistry.js';
import { ToolRouter } from './ToolRouter.js';
import { RecoveryEngine } from './RecoveryEngine.js';
import { EvidenceEngine } from './EvidenceEngine.js';

export interface AgentCoreDeps {
  worldState: WorldState;
  planner: Planner;
  executor: Executor;
  verifier: Verifier;
  policyEngine: PolicyEngine;
  memory: MemoryManager;
  reportEngine: ReportEngine;
  eventBus: EventBus;
  deviceRegistry: DeviceRegistry;
  toolRouter: ToolRouter;
  recovery: RecoveryEngine;
  evidenceEngine: EvidenceEngine;
}

/**
 * AgentCore — Orchestrates Observe → Understand → Plan → Act → Verify → Recover → Report
 * Hard rule: NEVER claim success without verification + evidence
 */
export class AgentCore {
  constructor(private deps: AgentCoreDeps) {}

  /**
   * Universal Agent Loop (single iteration for one task)
   */
  async runTask(task: Task): Promise<Task> {
    const { worldState, planner, executor, memory, reportEngine, deviceRegistry } = this.deps;

    // 1. Observe already via WorldState — caller should have updated it
    const observation = worldState.get();

    // 2. Plan
    const plan = planner.plan(task, worldState);
    const plannedTask: Task = {
      ...task,
      steps: plan.steps,
      status: 'PLANNED',
      updatedAt: new Date().toISOString(),
    };

    // 3. Route to best device
    const deviceId = this.selectDevice(plannedTask, observation);
    if (!deviceId) {
      const blocked: Task = { ...plannedTask, status: 'BLOCKED', error: 'No suitable device online', updatedAt: new Date().toISOString() };
      await memory.record(blocked);
      await reportEngine.generate(blocked);
      return blocked;
    }

    // 4. Execute with verification + recovery (executor handles)
    const executed = await executor.executeTask(plannedTask, worldState, deviceId);

    // 5. Memory + Report
    await memory.record(executed);
    await reportEngine.generate(executed);

    // 6. Publish event
    this.deps.eventBus.publish({
      type: 'task.completed',
      payload: { taskId: executed.id, status: executed.status },
      timestamp: new Date().toISOString(),
    });

    return executed;
  }

  private selectDevice(task: Task, observation: ReturnType<WorldState['get']>): string | null {
    // Prefer requested device, else any online
    const online = observation.devices.filter(d => d.online);
    if (task.device !== 'any') {
      const match = online.find(d => d.type === task.device);
      if (match) return match.deviceId;
    }
    // Fallback to any online; if none, try registry
    if (online.length > 0) return online[0].deviceId;
    const registryOnline = this.deps.deviceRegistry.getOnline();
    if (registryOnline.length > 0) return registryOnline[0].deviceId;
    return null;
  }

  async cancelTask(taskId: string): Promise<{ success: boolean; reason?: string }> {
    // In-memory cancellation — real would interrupt executor
    return { success: true, reason: 'Cancelled by user' };
  }

  getToolList(): string[] {
    return this.deps.toolRouter.listTools();
  }
}
