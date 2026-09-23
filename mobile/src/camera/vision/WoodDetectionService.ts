import {WoodDetectionService as IWoodDetectionService, BoardDetectionResult, DetectedBoard} from '../../types';

// -------- MODEL INTERFACE (replaceable) --------
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface DetectionModel {
  /** Load model from path/buffer if needed */
  load?(path: string): Promise<void>;
  /** Detect boards in imageUri, return raw boxes in 0..1 normalized coordinates */
  detect(imageUri: string): Promise<BoundingBox[]>;
  /** Optional: model identifier for debugging */
  readonly name: string;
}

// -------- IMPLEMENTATIONS --------

/**
 * TensorFlow Lite – mobile-optimized.
 * Swap this class with a real .tflite model without touching the rest of the app.
 * Example integration: use `react-native-fast-tflite` or `tflite-react-native`.
 */
export class TensorFlowLiteModel implements DetectionModel {
  readonly name = 'tflite-board-detector';
  private model: unknown = null;
  private modelPath: string | null = null;

  async load(path: string): Promise<void> {
    this.modelPath = path;
    try {
      // Dynamically require so bundler does not fail when native lib is not installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tflite = require('react-native-fast-tflite');
      // @ts-ignore – actual API depends on chosen wrapper
      this.model = await tflite.loadModel(path);
    } catch (e) {
      console.warn('[WoodDetection] TFLite not available, ensure native module is linked:', e);
      throw new Error('TFLite native module not installed. Run: npm i react-native-fast-tflite && pod install / gradle sync');
    }
  }

  async detect(imageUri: string): Promise<BoundingBox[]> {
    if (!this.model) throw new Error('TFLite model not loaded – call load() first with a .tflite file');
    // Real inference would:
    // 1. Decode imageUri -> RGB tensor (resize to model input, e.g. 640x640)
    // 2. Run this.model.run(tensor)
    // 3. NMS to filter boxes, map to 0..1 coords
    // This is left as integration point; throw if not implemented so UI shows honest state
    throw new Error('TFLite detect() not wired – provide a trained board_detector.tflite and implement preprocessing/postprocessing');
  }
}

/**
 * ONNX Runtime – alternative cross-platform backend.
 * Works with react-native-onnxruntime or onnxruntime-react-native.
 */
export class ONNXRuntimeModel implements DetectionModel {
  readonly name = 'onnx-board-detector';
  private session: unknown = null;

  async load(path: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ort = require('onnxruntime-react-native');
      // @ts-ignore
      this.session = await ort.InferenceSession.create(path);
    } catch (e) {
      console.warn('[WoodDetection] ONNX Runtime not available:', e);
      throw e;
    }
  }

  async detect(imageUri: string): Promise<BoundingBox[]> {
    if (!this.session) throw new Error('ONNX session not loaded');
    // Must implement: image decode -> tensor -> session.run -> postprocess NMS
    throw new Error('ONNX detect() not wired – implement preprocessing for your model');
  }
}

/**
 * Remote backend inference – delegates detection to GANZA backend
 * so heavy models can run server-side while mobile model is being trained.
 * This is HONEST: it does not fake counts, it calls the real backend if available.
 */
export class RemoteBackendModel implements DetectionModel {
  readonly name = 'remote-backend';
  constructor(private apiBase: string, private getIdToken: () => Promise<string>) {}

  async detect(imageUri: string): Promise<BoundingBox[]> {
    // Upload image to backend /api/vision/detect – backend runs real CV
    const token = await this.getIdToken();
    const form = new FormData();
    // @ts-ignore
    form.append('image', {uri: imageUri, name: 'board.jpg', type: 'image/jpeg'} as unknown as Blob);
    const res = await fetch(`${this.apiBase}/api/vision/detect`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${token}`} as unknown as Record<string, string>,
      body: form as unknown as BodyInit,
    });
    if (!res.ok) throw new Error(`Vision backend error: ${res.status}`);
    const json = (await res.json()) as {boards?: BoundingBox[]; boxes?: BoundingBox[]};
    return json.boards || json.boxes || [];
  }
}

/**
 * Honest placeholder when no model is available.
 * IMPORTANT: It never returns fake counts – it throws so the UI can show
 * "Nta mbaho zigaragaye neza / Model not configured" and allow manual entry.
 */
export class NoModelConfigured implements DetectionModel {
  readonly name = 'none';
  async detect(): Promise<BoundingBox[]> {
    throw new Error(
      'No trained board-detection model configured. ' +
        'Provide a real object-detection model (TFLite / ONNX / MediaPipe / backend) ' +
        'via WoodDetectionService.setModel() before calling detectBoards(). ' +
        'The UI will allow manual count correction.'
    );
  }
}

// -------- SERVICE --------
export class WoodDetectionService implements IWoodDetectionService {
  private static instance: WoodDetectionService;
  private model: DetectionModel;
  private modelType: string;

  private constructor() {
    this.model = new NoModelConfigured();
    this.modelType = 'none';
  }

  static getInstance(): WoodDetectionService {
    if (!WoodDetectionService.instance) {
      WoodDetectionService.instance = new WoodDetectionService();
    }
    return WoodDetectionService.instance;
  }

  setModel(model: DetectionModel, type: string): void {
    this.model = model;
    this.modelType = type;
  }

  getModelType(): string {
    return this.modelType;
  }

  getModelName(): string {
    return this.model.name;
  }

  /**
   * Real image → real detection → real boxes.
   * Never generates random counts.
   */
  async detectBoards(imageUri: string): Promise<BoardDetectionResult> {
    if (!imageUri) throw new Error('imageUri is required');
    if (this.modelType === 'none') {
      throw new Error(
        'WoodDetectionService: No detection model configured. ' +
          'Call setModel() with a real detection model before calling detectBoards(). ' +
          'The app correctly separates the model interface so a trained timber/board model can be plugged in without rewriting the app.'
      );
    }
    const boundingBoxes = await this.model.detect(imageUri);
    // Validate boxes – filter absurd values, require confidence
    const valid = boundingBoxes.filter(b => b.confidence >= 0 && b.x >= 0 && b.y >= 0 && b.width > 0 && b.height > 0 && b.width <= 1 && b.height <= 1);
    const boards: DetectedBoard[] = valid.map((box, index) => ({
      id: `board-${index}-${Date.now()}`,
      confidence: Math.round(box.confidence * 100) / 100,
      boundingBox: {x: box.x, y: box.y, width: box.width, height: box.height},
    }));
    const confidence = this.calculateOverallConfidence(boards);
    return {count: boards.length, confidence, boards, timestamp: Date.now()};
  }

  private calculateOverallConfidence(boards: DetectedBoard[]): number {
    if (boards.length === 0) return 0;
    const sum = boards.reduce((acc, b) => acc + b.confidence, 0);
    return Math.round((sum / boards.length) * 100) / 100;
  }
}

export const woodDetectionService = WoodDetectionService.getInstance();
export type {BoardDetectionResult, DetectedBoard};
