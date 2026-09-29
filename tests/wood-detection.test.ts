import { describe, it, expect } from 'vitest';
import { WoodDetectionService } from '../src/services/woodDetection.ts';

describe('Wood detection service', () => {
  it('does not invent object counts when no computer-vision provider is configured', async () => {
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
    expect(result.count).toBe(0);
    expect(result.boards).toHaveLength(0);
    expect(result.status).toBe('requires_confirmation');
    expect(result.quality?.status).toBe('NEEDS_REVIEW');
  });

  it('keeps small images usable for review instead of rejecting by file size', async () => {
    const service = new WoodDetectionService();
    const result = await service.detectBoards({mimeType: 'image/jpeg', size: 120000});

    expect(result.quality?.status).toBe('NEEDS_REVIEW');
    expect(result.status).toBe('requires_confirmation');
    expect(result.message).toContain('Enter or correct the count');
  });

  it('classifies only an explicitly non-image input as invalid', async () => {
    const service = new WoodDetectionService();
    const result = await service.detectBoards({mimeType: 'text/plain', size: 500000});

    expect(result.quality?.status).toBe('INVALID');
    expect(result.status).toBe('requires_confirmation');
  });

  it('requires an image input and rejects missing images clearly', async () => {
    const service = new WoodDetectionService();

    await expect(service.detectBoards(null as any)).rejects.toThrow('image input is required');
  });
});
