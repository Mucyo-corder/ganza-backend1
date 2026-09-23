export interface TraceEvent {
  traceId: string;
  taskId: string;
  stepId?: string;
  deviceId?: string;
  tool?: string;
  action?: string;
  startTime: string;
  endTime?: string;
  status: 'started' | 'success' | 'failed' | 'retry';
  error?: string;
  verification?: unknown;
}

export class Tracer {
  private traces: TraceEvent[] = [];

  start(taskId: string, stepId?: string, deviceId?: string, tool?: string): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.traces.push({
      traceId,
      taskId,
      stepId,
      deviceId,
      tool,
      startTime: new Date().toISOString(),
      status: 'started',
    });
    return traceId;
  }

  end(traceId: string, status: TraceEvent['status'], error?: string, verification?: unknown) {
    const t = this.traces.find(x => x.traceId === traceId);
    if (t) {
      t.endTime = new Date().toISOString();
      t.status = status;
      t.error = error;
      t.verification = verification;
    }
  }

  timeline(taskId: string): TraceEvent[] {
    return this.traces.filter(t => t.taskId === taskId);
  }

  getAll(): TraceEvent[] {
    return [...this.traces];
  }
}
