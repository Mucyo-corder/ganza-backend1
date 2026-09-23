/**
 * ModelRouter — selects VLM / LLM for reasoning vs perception
 */
export interface ModelRequest {
  prompt: string;
  imageBase64?: string;
  taskId: string;
}

export interface ModelResponse {
  raw: string;
  parsed?: unknown;
  model: string;
  latencyMs: number;
}

export class ModelRouter {
  // In production, route to Gemini / GPT-4V / local VLM based on capability
  async route(request: ModelRequest): Promise<ModelResponse> {
    const start = Date.now();
    // Stub — real implementation would call @google/genai or VLM SDK
    // For now, return NOT_IMPLEMENTED evidence so verifier never fakes success
    return {
      raw: JSON.stringify({ error: 'NOT_IMPLEMENTED', reason: 'ModelRouter not connected to real VLM in this environment' }),
      model: 'stub',
      latencyMs: Date.now() - start,
    };
  }
}
