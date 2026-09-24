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
  private photoOutput: CameraPhotoOutput | null = null;

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
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
    if (!this.photoOutput) {
      throw new Error('Camera ntiraboneka. Tegereza camera yitegure mbere yo gufata ifoto.');
    }

    try {
      const photoFile = await this.photoOutput.capturePhotoToFile(
        {
          flashMode:
            config?.flashMode === 'on'
              ? 'on'
              : config?.flashMode === 'auto'
                ? 'auto'
                : 'off',
        },
        {},
      );

      if (!photoFile?.filePath) {
        throw new Error('Ifoto ntiyabitswe neza. Ongera ugerageze.');
      }

      const uri = photoFile.filePath.startsWith('file://')
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;

      return {
        uri,
        width: 0,
        height: 0,
        fileSize: 0,
        mime: 'image/jpeg',
      };
    } catch (error) {
      console.warn('CAMERA_CAPTURE_ERROR', error);
      throw error instanceof Error
        ? error
        : new Error('Ifoto ntiyafashwe neza. Ongera ugerageze.');
    }
  }
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
