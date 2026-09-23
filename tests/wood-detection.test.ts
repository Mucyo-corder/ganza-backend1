import { describe, it, expect } from 'vitest';
import { WoodDetectionService } from '../src/services/woodDetection.ts';

describe('Wood detection service', () => {
  it('returns a structured detection result with a valid schema for a real image input', async () => {
    const service = new WoodDetectionService();

    const result = await service.detectBoards({
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF',
      mimeType: 'image/png',
      fileName: 'boards.png',
      size: 120000,
    });

    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('boards');
    expect(typeof result.count).toBe('number');
    expect(result.count).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.boards)).toBe(true);
  });

  it('requires an image input and rejects missing images clearly', async () => {
    const service = new WoodDetectionService();

    await expect(service.detectBoards(null as any)).rejects.toThrow('image input is required');
  });
});
