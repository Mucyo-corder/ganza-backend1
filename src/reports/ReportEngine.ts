import { Task } from '../agent/TaskModel.js';

export interface TaskReport {
  taskId: string;
  goal: string;
  status: Task['status'];
  stepsTotal: number;
  stepsPassed: number;
  stepsRecovered: number;
  evidenceCount: number;
  error?: string;
  generatedAt: string;
}

export interface DailyReport {
  date: string;
  total: number;
  passed: number;
  recovered: number;
  failed: number;
  blocked: number;
  notVerified: number;
  byDevice: Record<string, number>;
}

export class ReportEngine {
  private reports: Map<string, TaskReport> = new Map();
  private daily: Map<string, DailyReport> = new Map();

  async generate(task: Task): Promise<TaskReport> {
    const passed = task.evidence.filter(e => e.verification.success).length;
    const report: TaskReport = {
      taskId: task.id,
      goal: task.goal.description,
      status: task.status,
      stepsTotal: task.steps.length,
      stepsPassed: passed,
      stepsRecovered: task.status === 'RECOVERED' ? 1 : 0,
      evidenceCount: task.evidence.length,
      error: task.error,
      generatedAt: new Date().toISOString(),
    };
    this.reports.set(task.id, report);

    // Update daily
    const day = new Date().toISOString().slice(0, 10);
    const cur = this.daily.get(day) ?? { date: day, total: 0, passed: 0, recovered: 0, failed: 0, blocked: 0, notVerified: 0, byDevice: {} };
    cur.total++;
    if (report.status === 'PASSED') cur.passed++;
    else if (report.status === 'RECOVERED') cur.recovered++;
    else if (report.status === 'FAILED') cur.failed++;
    else if (report.status === 'BLOCKED' || report.status === 'NOT_SUPPORTED') cur.blocked++;
    else if (report.status === 'NOT_VERIFIED') cur.notVerified++;
    cur.byDevice[task.device] = (cur.byDevice[task.device] ?? 0) + 1;
    this.daily.set(day, cur);

    return report;
  }

  getTaskReport(taskId: string): TaskReport | undefined {
    return this.reports.get(taskId);
  }

  getDaily(date: string): DailyReport | undefined {
    return this.daily.get(date);
  }

  getAllDaily(): DailyReport[] {
    return Array.from(this.daily.values());
  }
}
