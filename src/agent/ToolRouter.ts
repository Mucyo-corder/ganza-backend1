export interface ToolCall {
  tool: string;
  action: string;
  params: Record<string, unknown>;
  deviceId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  evidence?: unknown;
}

/**
 * ToolRouter — routes action to correct device tool.
 * NEVER fakes success. If tool not implemented, returns NOT_SUPPORTED.
 */
export class ToolRouter {
  private tools: Map<string, (call: ToolCall) => Promise<ToolResult>> = new Map();

  register(toolName: string, handler: (call: ToolCall) => Promise<ToolResult>) {
    this.tools.set(toolName, handler);
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const handler = this.tools.get(call.tool);
    if (!handler) {
      return {
        success: false,
        error: `NOT_SUPPORTED: tool "${call.tool}" not registered for device ${call.deviceId ?? 'any'}`,
      };
    }
    try {
      const result = await handler(call);
      return result;
    } catch (e) {
      return {
        success: false,
        error: `FAILED: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}
