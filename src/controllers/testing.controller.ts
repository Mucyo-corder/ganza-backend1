import { Request, Response } from 'express';
import { CreateTestCaseSchema, createTestCaseId } from '../testing/TestModels.ts';
import { TestingRepository } from '../repositories/testing.repository.ts';
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
import { TestEngine } from '../testing/TestEngine.ts';
import { logger } from '../utils/logger.ts';

// Singleton engines (in-memory)
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
const agentCore = new AgentCore({
  worldState, planner, executor, verifier, policyEngine, memory, reportEngine, eventBus, deviceRegistry, toolRouter, recovery, evidenceEngine,
});
const testEngine = new TestEngine(agentCore);

// Register stub tools so executor can run sandbox-safe actions
toolRouter.register('filesystem', async (call) => ({ success: true, data: `filesystem ${call.action} simulated`, evidence: { files: [] } }));
toolRouter.register('generic', async (call) => ({ success: true, data: `executed ${call.action} on ${call.params?.goal ?? 'generic'}`, evidence: {} }));
toolRouter.register('app_launcher', async () => ({ success: true, data: 'Chrome opened', evidence: { ui: 'chrome' } }));
toolRouter.register('ui_automation', async () => ({ success: true, data: 'UI state changed', evidence: { ui: 'changed' } }));
toolRouter.register('keyboard', async () => ({ success: true, data: 'keyboard input verified', evidence: {} }));
toolRouter.register('wait', async () => ({ success: true, data: 'wait completed', evidence: {} }));

export const TestingController = {
  async createCase(req: Request, res: Response) {
    const parsed = CreateTestCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const user = (req as any).user;
    const testCase = {
      id: createTestCaseId(),
      name: parsed.data.name,
      goal: parsed.data.goal,
      device: parsed.data.device,
      target: parsed.data.target,
      permissions: parsed.data.permissions,
      riskLevel: parsed.data.riskLevel,
      mode: parsed.data.mode,
      expectedResult: parsed.data.expectedResult,
      maxSteps: parsed.data.maxSteps,
      timeoutMs: parsed.data.timeoutMs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: true,
      createdBy: user?.uid ?? 'anon',
      businessId: user?.businessId ?? 'default',
    };
    await TestingRepository.saveCase(testCase as any);
    logger.info('TestCase created', { id: testCase.id, goal: testCase.goal });
    res.status(201).json(testCase);
  },

  async listCases(req: Request, res: Response) {
    const cases = await TestingRepository.getCases();
    res.json(cases);
  },

  async getCase(req: Request, res: Response) {
    const c = await TestingRepository.getCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'TestCase not found' });
    res.json(c);
  },

  async runTest(req: Request, res: Response) {
    const c = await TestingRepository.getCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'TestCase not found' });
    // Ensure at least one device online (stub: register cloud)
    if (deviceRegistry.getAll().length === 0) {
      deviceRegistry.register({ deviceId: 'cloud_stub', type: 'cloud', label: 'Cloud Brain', online: true, capabilities: ['generic'], permissions: {}, lastSeen: new Date().toISOString(), health: 'healthy' });
      worldState.setDeviceState({ deviceId: 'cloud_stub', type: 'cloud', online: true, permissions: {}, lastSeen: new Date().toISOString() });
    }
    const run = await testEngine.run(c as any);
    await TestingRepository.saveRun(run);
    res.json(run);
  },

  async listRuns(req: Request, res: Response) {
    const testId = req.query.testId as string | undefined;
    const runs = await TestingRepository.getRuns(testId);
    res.json(runs);
  },

  async getRun(req: Request, res: Response) {
    const run = await TestingRepository.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: 'TestRun not found' });
    res.json(run);
  },

  async getEvidence(req: Request, res: Response) {
    const run = await TestingRepository.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: 'TestRun not found' });
    res.json({ runId: run.id, evidence: run.evidence, steps: run.steps });
  },
};
