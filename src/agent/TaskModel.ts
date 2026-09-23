import { z } from 'zod';

export const TaskStatusSchema = z.enum([
  'PLANNED',
  'RUNNING',
  'PASSED',
  'RECOVERED',
  'FAILED',
  'BLOCKED',
  'WAITING_PERMISSION',
  'NOT_SUPPORTED',
  'NOT_VERIFIED',
  'CANCELLED',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const DeviceTypeSchema = z.enum(['phone', 'desktop', 'cloud', 'any']);
export type DeviceType = z.infer<typeof DeviceTypeSchema>;

export const TaskTargetSchema = z.enum(['app', 'browser', 'filesystem', 'terminal', 'system', 'camera', 'calls', 'notifications']);
export type TaskTarget = z.infer<typeof TaskTargetSchema>;

export const VerificationStrategySchema = z.enum(['ui_state', 'ocr', 'dom', 'file_exists', 'tool_result', 'notification', 'manual']);
export type VerificationStrategy = z.infer<typeof VerificationStrategySchema>;

export interface TaskGoal {
  description: string;
  expectedResult: string;
  verificationStrategy: VerificationStrategy;
  maxSteps: number;
  timeoutMs: number;
}

export interface TaskStep {
  id: string;
  order: number;
  action: string;
  target?: string;
  params?: Record<string, unknown>;
  expectedResult: string;
  tool: string;
  verificationStrategy: VerificationStrategy;
  status: TaskStatus;
  evidenceRequired: boolean;
}

export interface TaskPolicy {
  requiresConfirmation: boolean;
  allowedDevices: DeviceType[];
  riskLevel: RiskLevel;
  requiresPermission?: string;
  retryLimit: number;
}

export interface Task {
  id: string;
  businessId: string;
  userId: string;
  goal: TaskGoal;
  device: DeviceType;
  target: TaskTarget;
  steps: TaskStep[];
  policy: TaskPolicy;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  evidence: Evidence[];
  error?: string;
}

export interface Evidence {
  timestamp: string;
  deviceId: string;
  deviceType: DeviceType;
  action: string;
  target?: string;
  coordinate?: [number, number];
  normalizedCoordinate?: [number, number];
  beforeState?: unknown;
  toolResult?: unknown;
  afterState?: unknown;
  verification: VerificationResult;
  screenshotBefore?: string;
  screenshotAfter?: string;
  error?: string;
  retryCount: number;
}

export interface VerificationResult {
  success: boolean;
  method: VerificationStrategy;
  expected: string;
  observed: string;
  confidence?: number;
  evidenceExists: boolean;
  reason?: string;
}

export const CreateTaskSchema = z.object({
  goal: z.object({
    description: z.string().min(3).max(500),
    expectedResult: z.string().min(3).max(500),
    verificationStrategy: VerificationStrategySchema.default('ui_state'),
    maxSteps: z.number().min(1).max(50).default(10),
    timeoutMs: z.number().min(1000).max(300000).default(60000),
  }),
  device: DeviceTypeSchema.default('any'),
  target: TaskTargetSchema.default('app'),
  policy: z.object({
    requiresConfirmation: z.boolean().default(false),
    allowedDevices: z.array(DeviceTypeSchema).default(['any']),
    riskLevel: RiskLevelSchema.default('low'),
    requiresPermission: z.string().optional(),
    retryLimit: z.number().min(0).max(5).default(2),
  }).optional(),
});

export function createTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
export function createStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
