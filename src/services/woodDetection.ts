/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GANZA wood detection service interface.
 * This module keeps detection logic separate from the UI and is ready
 * for real ML integrations such as TensorFlow Lite, MediaPipe, ONNX,
 * or a backend vision model without rebuilding the app shell.
 */

export interface WoodDetectionInput {
  dataUrl?: string;
  file?: File;
  mimeType?: string;
  fileName?: string;
  size?: number;
}

export interface WoodBoardDetection {
  id: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WoodDetectionResult {
  count: number;
  confidence: number;
  boards: WoodBoardDetection[];
}

export interface WoodDetectionProvider {
  detectBoards(image: WoodDetectionInput): Promise<WoodDetectionResult>;
}

export class WoodDetectionService implements WoodDetectionProvider {
  async detectBoards(image: WoodDetectionInput): Promise<WoodDetectionResult> {
    if (!image) {
      throw new Error('image input is required');
    }

    const safeMimeType = image.mimeType || 'image/png';
    const size = image.size || 0;

    // Placeholder for a real machine-learning provider.
    // The interface is intentionally isolated so a proper model can be plugged in
    // later without rewriting the UI or backend contract.
    const safeResult: WoodDetectionResult = {
      count: Math.max(0, Math.min(100, Math.round(size / 2000))),
      confidence: 82,
      boards: Array.from({ length: Math.max(0, Math.min(10, Math.round(size / 2000))) }, (_, index) => ({
        id: `board-${Date.now()}-${index}`,
        confidence: 82 + (index % 3),
        boundingBox: {
          x: 10 + index * 9,
          y: 20 + index * 6,
          width: 60 + index * 2,
          height: 25 + index * 2,
        },
      })),
    };

    if (!safeMimeType.startsWith('image/')) {
      throw new Error('image input is required');
    }

    return safeResult;
  }
}

export const woodDetectionService = new WoodDetectionService();
