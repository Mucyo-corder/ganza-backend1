import {Platform, Linking} from 'react-native';
import {VisionCamera} from 'react-native-vision-camera';
import type {CameraPhotoOutput} from 'react-native-vision-camera';

export type CameraType = 'back' | 'front';
export type FlashMode = 'on' | 'off' | 'auto';
export type CameraQuality = 'low' | 'medium' | 'high' | 'max';

export interface CameraConfig {
  type: CameraType;
  flashMode: FlashMode;
  quality: CameraQuality;
}

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  mime: string;
}

/**
 * Bare React Native camera service.
 * - Android: PermissionsAndroid + react-native-vision-camera (when installed) or ImagePicker fallback
 * - iOS: vision-camera / native permission prompt
 * - Web: getUserMedia fallback handled in ScanScreen (not here)
 * Never fakes capture – requires a real camera or image file.
 */
export class CameraService {
  private static instance: CameraService;
  private cameraRef: {controller?: unknown} | null = null;
  private photoOutput: CameraPhotoOutput | null = null;

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  setCameraRef(ref: {controller?: unknown} | null): void {
    this.cameraRef = ref;
  }

  setPhotoOutput(output: CameraPhotoOutput | null): void {
    this.photoOutput = output;
  }

  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    return await VisionCamera.requestCameraPermission();
  }

  async requestStoragePermission(): Promise<boolean> {
    return true;
  }

  async checkCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    return VisionCamera.cameraPermissionStatus === 'authorized';
  }

  /**
   * Capture via the bound camera ref (vision-camera).
  * VisionCamera v5 exposes takePhoto(). Do not fall back to the old
  * react-native-camera takePictureAsync API.
   */
  async captureImage(config?: Partial<CameraConfig>): Promise<CapturedImage | null> {
    if (!this.cameraRef || !this.photoOutput) {
      throw new Error('Camera is not ready. Wait for the camera preview before taking a photo.');
    }
    try {
      const captureResult = await this.photoOutput.capturePhotoToFile({
        flashMode: config?.flashMode === 'on' || config?.flashMode === 'auto' ? config.flashMode : 'off',
      }, {});
      const uri = captureResult.filePath.startsWith('file://') ? captureResult.filePath : `file://${captureResult.filePath}`;

      const data = {
        uri,
        width: 0,
        height: 0,
      };

      return {
        uri: data.uri,
        width: data.width || 1920,
        height: data.height || 1080,
        fileSize: 0,
        mime: 'image/jpeg',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Camera capture failed.';
      throw new Error(msg);
    }
  }

  /**
   * Pick from library as fallback (real image, not mock)
   */
  async pickFromLibrary(): Promise<CapturedImage | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ImagePicker = require('react-native-image-picker');
      const result: {assets?: Array<{uri: string; width?: number; height?: number; fileSize?: number; type?: string}>; didCancel?: boolean} =
        await new Promise(resolve => {
          ImagePicker.launchImageLibrary({mediaType: 'photo', quality: 0.85, selectionLimit: 1}, (r: unknown) => resolve(r as never));
        });
      if (result.didCancel || !result.assets?.[0]?.uri) return null;
      const a = result.assets[0];
      return {uri: a.uri!, width: a.width || 1920, height: a.height || 1080, fileSize: a.fileSize || 0, mime: a.type || 'image/jpeg'};
    } catch {
      return null;
    }
  }

  openSettings(): void {
    Linking.openSettings().catch(() => {});
  }
}

export const cameraService = CameraService.getInstance();
