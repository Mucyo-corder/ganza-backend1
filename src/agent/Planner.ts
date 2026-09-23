import { Task, TaskStep, createStepId } from './TaskModel.js';
import { WorldState } from './WorldState.js';

export interface Plan {
  taskId: string;
  steps: TaskStep[];
  reasoning: string;
}

export class Planner {
  /**
   * Decompose goal into task graph steps.
   * In production, this would call LLM / rule engine.
   * Here we provide deterministic decomposition with evidence-backed verification fields.
   */
  plan(task: Task, worldState: WorldState): Plan {
    const goal = task.goal.description.toLowerCase();
    const state = worldState.get();

    // Simple rule-based decomposition — extend with LLM later
    let steps: Omit<TaskStep, 'id' | 'status'>[] = [];

    if (goal.includes('chrome') && goal.includes('search')) {
      steps = [
        { order: 1, action: 'open_app', target: 'Chrome', params: { app: 'com.android.chrome' }, expectedResult: 'Chrome opened', tool: 'app_launcher', verificationStrategy: 'ui_state', evidenceRequired: true },
        { order: 2, action: 'click', target: 'search_field', params: {}, expectedResult: 'search field focused', tool: 'ui_automation', verificationStrategy: 'ui_state', evidenceRequired: true },
        { order: 3, action: 'type', target: 'search_field', params: { text: this.extractSearchTerm(task.goal.description) }, expectedResult: `text entered: ${this.extractSearchTerm(task.goal.description)}`, tool: 'keyboard', verificationStrategy: 'ui_state', evidenceRequired: true },
        { order: 4, action: 'key', target: 'Enter', params: { key: 'Enter' }, expectedResult: 'search submitted', tool: 'keyboard', verificationStrategy: 'ui_state', evidenceRequired: true },
        { order: 5, action: 'wait', target: 'results', params: { ms: 2000 }, expectedResult: 'search results visible', tool: 'wait', verificationStrategy: 'ui_state', evidenceRequired: true },
      ];
    } else if (goal.includes('file') || goal.includes('report')) {
      steps = [
        { order: 1, action: 'filesystem_read', target: 'data', params: {}, expectedResult: 'data collected', tool: 'filesystem', verificationStrategy: 'tool_result', evidenceRequired: true },
        { order: 2, action: 'filesystem_write', target: 'report', params: {}, expectedResult: 'report generated', tool: 'filesystem', verificationStrategy: 'file_exists', evidenceRequired: true },
      ];
    } else {
      // Generic single-step plan — user must provide expectedResult that verifier can check
      steps = [
        { order: 1, action: 'execute', target: task.target, params: { goal: task.goal.description }, expectedResult: task.goal.expectedResult, tool: 'generic', verificationStrategy: task.goal.verificationStrategy, evidenceRequired: true },
      ];
    }

    // Apply maxSteps limit
    steps = steps.slice(0, task.goal.maxSteps);

    const taskSteps: TaskStep[] = steps.map(s => ({
      id: createStepId(),
      ...s,
      status: 'PLANNED',
    }));

    return {
      taskId: task.id,
      steps: taskSteps,
      reasoning: `Planned ${taskSteps.length} steps for goal "${task.goal.description}" given ${state.devices.length} devices`,
    };
  }

  private extractSearchTerm(goal: string): string {
    const m = goal.match(/search for (.+)/i) ?? goal.match(/search (.+)/i);
    return m ? m[1].trim().replace(/["']/g, '') : 'GANZA';
  }
}
