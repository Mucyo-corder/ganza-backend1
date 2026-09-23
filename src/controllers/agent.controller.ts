import { Request, Response } from 'express';
import { CreateTaskSchema, createTaskId } from '../agent/TaskModel.ts';
import { WorldState } from '../agent/WorldState.ts';
import { Planner } from '../agent/Planner.ts';
import { ToolRouter } from '../agent/ToolRouter.ts';
import { Verifier } from '../agent/Verifier.ts';
import { RecoveryEngine } from '../agent/RecoveryEngine.ts';
import { EvidenceEngine } from '../agent/EvidenceEngine.ts';
import { PolicyEngine } from '../agent/PolicyEngine.ts';
import { Executor } from '../agent/Executor.ts';
import { AgentCore } from '../agent/AgentCore.ts';
import { EventBus } from '../events/EventBus.ts';
import { DeviceRegistry } from '../devices/DeviceRegistry.ts';
import { MemoryManager } from '../memory/MemoryManager.ts';
import { ReportEngine } from '../reports/ReportEngine.ts';
import { logger } from '../utils/logger.ts';

const worldState = new WorldState();
const planner = new Planner();
const toolRouter = new ToolRouter();
const verifier = new Verifier();
const recovery = new RecoveryEngine();
const evidenceEngine = new EvidenceEngine();
const policyEngine = new PolicyEngine();
const executor = new Executor(toolRouter, verifier, recovery, evidenceEngine, policyEngine);
const eventBus = new EventBus();
const deviceRegistry = new DeviceRegistry();
const memory = new MemoryManager();
const reportEngine = new ReportEngine();
const agentCore = new AgentCore({ worldState, planner, executor, verifier, policyEngine, memory, reportEngine, eventBus, deviceRegistry, toolRouter, recovery, evidenceEngine });

toolRouter.register('filesystem', async (call) => ({ success: true, data: `filesystem ${call.action}`, evidence: {} }));
toolRouter.register('generic', async (call) => ({ success: true, data: `generic ${call.action}`, evidence: {} }));
toolRouter.register('app_launcher', async () => ({ success: true, data: 'app opened', evidence: {} }));
toolRouter.register('ui_automation', async () => ({ success: true, data: 'ui changed', evidence: {} }));
toolRouter.register('keyboard', async () => ({ success: true, data: 'typed', evidence: {} }));
toolRouter.register('wait', async () => ({ success: true, data: 'waited', evidence: {} }));

// In-memory task store (fallback)
const taskStore = new Map<string, any>();

export const AgentController = {
  async createTask(req: Request, res: Response) {
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    const user = (req as any).user;
    const task = {
      id: createTaskId(),
      businessId: user?.businessId ?? 'default',
      userId: user?.uid ?? 'anon',
      goal: parsed.data.goal,
      device: parsed.data.device,
      target: parsed.data.target,
      policy: parsed.data.policy ?? { requiresConfirmation: false, allowedDevices: ['any'], riskLevel: 'low', retryLimit: 2 },
      steps: [],
      status: 'PLANNED' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
    };
    taskStore.set(task.id, task);
    // Fire-and-forget execution via AgentCore (if device available)
    if (deviceRegistry.getAll().length === 0) {
      deviceRegistry.register({ deviceId: 'cloud_brain', type: 'cloud', label: 'Cloud Brain', online: true, capabilities: ['generic'], permissions: {}, lastSeen: new Date().toISOString(), health: 'healthy' });
      worldState.setDeviceState({ deviceId: 'cloud_brain', type: 'cloud', online: true, permissions: {}, lastSeen: new Date().toISOString() });
    }
    const executed = await agentCore.runTask(task as any);
    taskStore.set(executed.id, executed);
    logger.info('Task executed', { taskId: executed.id, status: executed.status });
    res.status(201).json(executed);
  },

  async getTask(req: Request, res: Response) {
    const t = taskStore.get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    res.json(t);
  },

  async listTasks(_req: Request, res: Response) {
    res.json(Array.from(taskStore.values()));
  },

  async cancelTask(req: Request, res: Response) {
    const t = taskStore.get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    t.status = 'CANCELLED';
    t.updatedAt = new Date().toISOString();
    res.json(t);
  },

  async getEvidence(req: Request, res: Response) {
    const t = taskStore.get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    res.json({ taskId: t.id, evidence: t.evidence });
  },

  async getReport(req: Request, res: Response) {
    const t = taskStore.get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    const report = await reportEngine.generate(t as any);
    res.json(report);
  },
};

export { taskStore, agentCore };
