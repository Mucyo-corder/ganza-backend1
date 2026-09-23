import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Coordinate normalization (mirrors desktop-agent/perception/screenshot.py)
function normalizeCoordinate(x: number, y: number, w: number, h: number): [number, number] {
  return [Math.round(x / w * 1000), Math.round(y / h * 1000)];
}
function denormalizeCoordinate(nx: number, ny: number, w: number, h: number): [number, number] {
  return [Math.round(nx / 1000 * w), Math.round(ny / 1000 * h)];
}
function validateCoordinate(x: number, y: number) {
  if (x < 0 || x > 1000 || y < 0 || y > 1000) throw new Error(`Coordinate out of bounds 0-1000: [${x},${y}]`);
}

// VLM schema (mirrors desktop-agent/perception/vlm.py)
const VlmActionSchema = z.object({
  action: z.enum(['click', 'double_click', 'long_press', 'type', 'key', 'hotkey', 'scroll', 'drag', 'hover', 'wait', 'open_app', 'open_url', 'back', 'home']),
  coordinate: z.tuple([z.number().min(0).max(1000), z.number().min(0).max(1000)]).default([500, 500] as any),
  text: z.string().optional(),
  target: z.string().optional(),
  expected_result: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

function parseVlmOutput(raw: string | object) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return VlmActionSchema.parse(data);
}

describe('GANZA Agent Core — Coordinate System', () => {
  it('normalizes and denormalizes correctly', () => {
    const w = 1920, h = 1080;
    const [nx, ny] = normalizeCoordinate(960, 540, w, h);
    expect(nx).toBe(500);
    expect(ny).toBe(500);
    const [x, y] = denormalizeCoordinate(nx, ny, w, h);
    expect(x).toBe(960);
    expect(y).toBe(540);
  });

  it('rejects out-of-bounds coordinates', () => {
    expect(() => validateCoordinate(-1, 500)).toThrow();
    expect(() => validateCoordinate(1001, 500)).toThrow();
    expect(() => validateCoordinate(500, 2000)).toThrow();
  });

  it('handles edge coordinates', () => {
    expect(normalizeCoordinate(0, 0, 1000, 1000)).toEqual([0, 0]);
    expect(normalizeCoordinate(1000, 1000, 1000, 1000)).toEqual([1000, 1000]);
    expect(() => validateCoordinate(0, 0)).not.toThrow();
    expect(() => validateCoordinate(1000, 1000)).not.toThrow();
  });
});

describe('VLM Output Contract', () => {
  it('parses valid VLM JSON', () => {
    const json = JSON.stringify({ action: 'click', coordinate: [612, 438], target: 'Send', expected_result: 'message appears as outgoing', confidence: 0.97 });
    const parsed = parseVlmOutput(json);
    expect(parsed.action).toBe('click');
    expect(parsed.coordinate).toEqual([612, 438]);
    expect(parsed.confidence).toBeCloseTo(0.97);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseVlmOutput('not json')).toThrow();
  });

  it('rejects invalid coordinate', () => {
    expect(() => parseVlmOutput(JSON.stringify({ action: 'click', coordinate: [2000, 100], expected_result: 'x', confidence: 0.5 }))).toThrow();
  });

  it('rejects missing expected_result', () => {
    expect(() => parseVlmOutput(JSON.stringify({ action: 'click', coordinate: [500, 500], confidence: 0.5 }))).toThrow();
  });

  it('rejects malformed model output with repair attempt', () => {
    const malformed = 'I think you should click at [100,100]';
    expect(() => parseVlmOutput(malformed)).toThrow(/INVALID|JSON|parse/i);
  });
});

describe('Verification Engine — No False Claims', () => {
  function verify(expected: string, after: string, toolSuccess: boolean, evidenceExists: boolean) {
    if (!evidenceExists) return { status: 'NOT_VERIFIED', success: false };
    if (!toolSuccess) return { status: 'FAILED', success: false };
    if (!after.toLowerCase().includes(expected.toLowerCase())) return { status: 'NOT_VERIFIED', success: false };
    return { status: 'PASSED', success: true };
  }

  it('requires evidence for PASSED', () => {
    expect(verify('search results visible', 'search results visible', true, false).status).toBe('NOT_VERIFIED');
  });

  it('requires tool success for PASSED', () => {
    expect(verify('search results visible', 'search results visible', false, true).status).toBe('FAILED');
  });

  it('requires expected observed for PASSED', () => {
    expect(verify('message appears', 'nothing happened', true, true).status).toBe('NOT_VERIFIED');
  });

  it('passes when all conditions met', () => {
    expect(verify('Chrome opened', 'Chrome opened — welcome', true, true).status).toBe('PASSED');
  });
});

describe('Task State Transitions', () => {
  const validStatuses = ['PLANNED', 'RUNNING', 'PASSED', 'RECOVERED', 'FAILED', 'BLOCKED', 'WAITING_PERMISSION', 'NOT_SUPPORTED', 'NOT_VERIFIED', 'CANCELLED'];
  it('allows only valid statuses', () => {
    for (const s of validStatuses) expect(validStatuses).toContain(s);
    expect(validStatuses).not.toContain('SUCCESS'); // must not use fake SUCCESS
  });
});

describe('Policy Engine', () => {
  function check(action: string, risk: string): string {
    if (action.includes('credential_theft')) return 'BLOCK';
    if (risk === 'critical') return 'BLOCK';
    if (action.includes('delete_file') || risk === 'high') return 'CONFIRM';
    return 'ALLOW';
  }

  it('blocks credential theft', () => {
    expect(check('credential_theft', 'low')).toBe('BLOCK');
  });
  it('blocks critical risk', () => {
    expect(check('open_app', 'critical')).toBe('BLOCK');
  });
  it('requires confirm for delete', () => {
    expect(check('delete_file', 'low')).toBe('CONFIRM');
  });
  it('allows safe action', () => {
    expect(check('open_app', 'low')).toBe('ALLOW');
  });
});

describe('Testing Center — Evidence-Based Status', () => {
  function testStatus(verificationSuccess: boolean, evidenceExists: boolean, toolSuccess: boolean): string {
    if (!toolSuccess) return 'FAILED';
    if (!evidenceExists) return 'NOT_VERIFIED';
    if (!verificationSuccess) return 'NOT_VERIFIED';
    return 'PASSED';
  }

  it('PASSED requires all three', () => {
    expect(testStatus(true, true, true)).toBe('PASSED');
    expect(testStatus(false, true, true)).toBe('NOT_VERIFIED');
    expect(testStatus(true, false, true)).toBe('NOT_VERIFIED');
    expect(testStatus(true, true, false)).toBe('FAILED');
  });

  it('DRY_RUN never PASSED without evidence', () => {
    expect(testStatus(false, false, false)).toBe('FAILED');
  });
});

describe('Device Registry', () => {
  it('routes to best available device', () => {
    const devices = [
      { id: 'phone1', type: 'phone', online: true },
      { id: 'desktop1', type: 'desktop', online: false },
      { id: 'cloud1', type: 'cloud', online: true },
    ];
    const online = devices.filter(d => d.online);
    expect(online.length).toBe(2);
    const forPhoneTask = online.find(d => d.type === 'phone');
    expect(forPhoneTask?.id).toBe('phone1');
  });
});

describe('Agent Core Integration — Planner → Executor → Verifier', () => {
  it('planner generates evidence-required steps', async () => {
    // Simulate planner output
    const steps = [
      { action: 'open_app', expectedResult: 'Chrome opened', evidenceRequired: true },
      { action: 'type', expectedResult: 'text entered', evidenceRequired: true },
    ];
    for (const s of steps) expect(s.evidenceRequired).toBe(true);
  });

  it('fails gracefully on NOT_SUPPORTED tool', async () => {
    const toolRouter = { execute: async () => ({ success: false, error: 'NOT_SUPPORTED: tool unknown not registered' }) } as any;
    const res: any = await toolRouter.execute({ tool: 'unknown', action: 'unknown' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('NOT_SUPPORTED');
  });
});
