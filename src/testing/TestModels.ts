import { z } from 'zod';

export const TestingModeSchema = z.enum(['OBSERVE_ONLY', 'DRY_RUN', 'SANDBOX', 'EXECUTE', 'REPLAY']);
export type TestingMode = z.infer<typeof TestingModeSchema>;

export const TestStatusSchema = z.enum(['PENDING', 'RUNNING', 'PASSED', 'FAILED', 'NOT_VERIFIED', 'BLOCKED', 'CANCELLED']);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export interface TestCase {
  id: string;
  name: string;
  goal: string;
  device: 'phone' | 'desktop' | 'cloud' | 'any';
  target: string;
  permissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mode: TestingMode;
  expectedResult: string;
  maxSteps: number;
  timeoutMs: number;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  createdBy: string;
}

export interface TestRun {
  id: string;
  testId: string;
  status: TestStatus;
  mode: TestingMode;
  startedAt: string;
  endedAt?: string;
  steps: TestStepRun[];
  evidence: TestEvidence[];
  error?: string;
  retryCount: number;
}

export interface TestStepRun {
  id: string;
  order: number;
  action: string;
  target?: string;
  result?: unknown;
  verification: {
    success: boolean;
    expected: string;
    observed: string;
    reason?: string;
  };
  screenshotBefore?: string;
  screenshotAfter?: string;
  durationMs: number;
}

export interface TestEvidence {
  timestamp: string;
  stepId: string;
  action: string;
  beforeScreenshot?: string;
  afterScreenshot?: string;
  toolResult?: unknown;
  verification: {
    success: boolean;
    reason?: string;
  };
}

export const CreateTestCaseSchema = z.object({
  name: z.string().min(3).max(100),
  goal: z.string().min(5).max(500),
  device: z.enum(['phone', 'desktop', 'cloud', 'any']).default('any'),
  target: z.string().min(1).max(100).default('app'),
  mode: TestingModeSchema.default('EXECUTE'),
  expectedResult: z.string().min(3).max(500),
  maxSteps: z.number().min(1).max(30).default(10),
  timeoutMs: z.number().min(1000).max(300000).default(60000),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  permissions: z.array(z.string()).default([]),
});

export function createTestCaseId(): string {
  return `tcase_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
export function createTestRunId(): string {
  return `trun_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
