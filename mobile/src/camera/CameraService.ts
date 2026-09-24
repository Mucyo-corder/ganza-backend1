import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';

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
  private cameraRef: unknown = null;

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  setCameraRef(ref: unknown): void {
    this.cameraRef = ref;
  }

  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'GANZA Kamera',
        message: 'GANZA ikeneye kamera kugira ngo isuzume imbaho.',
        buttonNeutral: 'Nyuma',
        buttonNegative: 'Oya',
        buttonPositive: 'Yego',
      });
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (Platform.OS === 'ios') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {Camera} = require('react-native-vision-camera');
        const status = await Camera.requestCameraPermission();
        return status === 'granted' || status === 'authorized';
      } catch {
        // If vision-camera not installed, assume granted – actual capture will fail gracefully
        return true;
      }
    }
    return true;
  }

  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version < 33) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
        title: 'Ububiko',
        message: 'GANZA ikeneye ububiko kugira ngo ibike amafoto.',
        buttonNeutral: 'Nyuma',
        buttonNegative: 'Oya',
        buttonPositive: 'Yego',
      });
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async checkCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      return result;
    }
    if (Platform.OS === 'ios') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {Camera} = require('react-native-vision-camera');
        const status = await Camera.getCameraPermissionStatus();
        return status === 'granted' || status === 'authorized';
      } catch {
        return true;
      }
    }
    return true;
  }

  /**
   * Capture via the bound camera ref (vision-camera).
   * The ref is expected to expose takePhoto() or takePictureAsync().
   */
  async captureImage(config?: Partial<CameraConfig>): Promise<CapturedImage | null> {
    if (!this.cameraRef) {
      throw new Error('Kamera ntiyiteguye. Ongera ugerageze.');
    }
    try {
      const camera = this.cameraRef as {
        takePhoto?: (opts?: unknown) => Promise<{path?: string; uri?: string; width?: number; height?: number}>;
        takePictureAsync?: (opts?: unknown) => Promise<{uri: string; width?: number; height?: number}>;
      };
      let data: {uri: string; width?: number; height?: number} | null = null;
      if (camera.takePhoto) {
        const res = await camera.takePhoto({
          flash: config?.flashMode || 'off',
          qualityPrioritization: 'balanced',
        });
        const uri = res.path ? `file://${res.path}` : res.uri;
        if (!uri) throw new Error('Ifoto yagaragaye ariko ntizagaragaye neza');
        data = {uri, width: res.width, height: res.height};
      } else if (camera.takePictureAsync) {
        const res = await camera.takePictureAsync({
          quality: config?.quality === 'max' ? 1 : config?.quality === 'high' ? 0.85 : 0.6,
          skipProcessing: false,
        });
        data = {uri: res.uri, width: res.width, height: res.height};
      } else {
        throw new Error('Camera ref missing takePhoto/takePictureAsync');
      }
      if (!data) throw new Error('Gufata ifoto byanze');
      return {
        uri: data.uri,
        width: data.width || 1920,
        height: data.height || 1080,
        fileSize: 0,
        mime: 'image/jpeg',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gufata ifoto byanze';
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
