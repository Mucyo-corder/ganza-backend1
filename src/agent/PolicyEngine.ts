import { Task, RiskLevel } from './TaskModel.js';

export type PolicyDecision = 'ALLOW' | 'CONFIRM' | 'BLOCK';

export interface PolicyCheckResult {
  decision: PolicyDecision;
  reason: string;
  requiredPermission?: string;
}

const BLOCKED_ACTIONS = [
  'credential_theft',
  'security_bypass',
  'delete_system',
  'exfiltrate_secrets',
];

const CONFIRM_ACTIONS = [
  'delete_file',
  'financial_action',
  'sensitive_call',
  'send_sms',
  'uninstall_app',
  'format_storage',
];

export class PolicyEngine {
  check(task: Task, action: string, riskLevel: RiskLevel): PolicyCheckResult {
    if (BLOCKED_ACTIONS.some(b => action.includes(b))) {
      return { decision: 'BLOCK', reason: `Blocked action pattern: ${action}` };
    }
    if (riskLevel === 'critical') {
      return { decision: 'BLOCK', reason: 'Critical risk level blocked by policy' };
    }
    if (riskLevel === 'high' || CONFIRM_ACTIONS.some(c => action.includes(c))) {
      return { decision: 'CONFIRM', reason: `High-risk action requires confirmation: ${action}`, requiredPermission: task.policy.requiresPermission };
    }
    if (task.policy.requiresConfirmation) {
      return { decision: 'CONFIRM', reason: 'Task policy requires confirmation', requiredPermission: task.policy.requiresPermission };
    }
    return { decision: 'ALLOW', reason: 'Policy allows' };
  }

  checkTask(task: Task): PolicyCheckResult {
    return this.check(task, task.goal.description, task.policy.riskLevel);
  }
}
