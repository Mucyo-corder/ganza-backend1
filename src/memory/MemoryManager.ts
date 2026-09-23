import { Task, TaskStatus } from '../agent/TaskModel.js';

export interface MemoryRecord {
  id: string;
  taskId: string;
  goal: string;
  status: TaskStatus;
  device: string;
  steps: number;
  evidenceCount: number;
  timestamp: string;
}

export class MemoryManager {
  private episodic: MemoryRecord[] = [];
  private semantic: Map<string, unknown> = new Map();

  async record(task: Task): Promise<void> {
    this.episodic.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      taskId: task.id,
      goal: task.goal.description,
      status: task.status,
      device: task.device,
      steps: task.steps.length,
      evidenceCount: task.evidence.length,
      timestamp: new Date().toISOString(),
    });
    // Keep last 1000
    if (this.episodic.length > 1000) this.episodic.shift();
  }

  getRecent(limit = 20): MemoryRecord[] {
    return this.episodic.slice(-limit).reverse();
  }

  recallSuccessfulPattern(goal: string): MemoryRecord | undefined {
    return this.episodic.find(m => m.goal === goal && (m.status === 'PASSED' || m.status === 'RECOVERED'));
  }

  clear(): void {
    this.episodic = [];
    this.semantic.clear();
  }

  export(): { episodic: MemoryRecord[]; semantic: Record<string, unknown> } {
    return { episodic: this.episodic, semantic: Object.fromEntries(this.semantic) };
  }
}
