import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {cameraService} from '../../camera/CameraService';
import {woodDetectionService} from '../../camera/vision/WoodDetectionService';
import {Button} from '../../components/common/Button';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {BoardDetectionResult} from '../../types';
import {compressImageUri} from '../../utils/formatters';

// Lazy load vision-camera only if native module is installed
let VisionCamera: unknown = null;
let useCameraPermissionHook: unknown = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cam = require('react-native-vision-camera');
  VisionCamera = cam.Camera;
  useCameraPermissionHook = cam.useCameraPermission;
} catch {}

export default function ScanScreen({navigation}: {navigation: {navigate: (s: string, p?: unknown) => void}}) {
  const {user} = useAuth();
  const {t} = useLocalization();
  const cameraRef = useRef<unknown>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<BoardDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [visionAvailable, setVisionAvailable] = useState(false);
  const [previewMode, setPreviewMode] = useState<'camera' | 'web-file' | 'none'>('camera');

  useEffect(() => {
    setVisionAvailable(!!VisionCamera);
    if (Platform.OS === 'web') {
      setPreviewMode('web-file');
      setHasCameraPermission(true);
      return;
    }
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const ok = await cameraService.requestCameraPermission();
    const storageOk = await cameraService.requestStoragePermission();
    setHasCameraPermission(ok && storageOk);
    if (!ok) {
      Alert.alert(t('error'), t('cameraPermissionDenied'), [
        {text: t('cancel'), style: 'cancel'},
        {text: 'Settings', onPress: () => Linking.openSettings()},
      ]);
    }
  };

  const capturePhoto = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Vision-camera path
      if (VisionCamera && cameraRef.current) {
        cameraService.setCameraRef(cameraRef.current);
        const image = await cameraService.captureImage({flashMode, quality: 'high'});
        if (!image) throw new Error(t('backendError'));
        const compressed = await compressImageUri(image.uri, 1280, 0.8);
        setCapturedImage(compressed);
        await runDetection(compressed);
        return;
      }
      // Fallback: image picker (real image, honest fallback)
      const picked = await cameraService.pickFromLibrary();
      if (!picked) {
        setLoading(false);
        return;
      }
      const compressed = await compressImageUri(picked.uri, 1280, 0.8);
      setCapturedImage(compressed);
      await runDetection(compressed);
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('backendError');
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  }, [flashMode, loading, t]);

  const handleWebFile = async (e: unknown) => {
    const input = e as {target: {files: FileList | null}};
    const file = input.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImage(url);
    setLoading(true);
    try {
      // For web, we treat uploaded file as the imageUri; detection will run via backend if configured
      await runDetection(url);
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async (imageUri: string) => {
    setLoading(true);
    setDetectionResult(null);
    try {
      if (woodDetectionService.getModelType() === 'none') {
        // Honest: no model configured – don't fake count, let user enter manually
        // We create a zero-count result so ScanResultScreen can still proceed with manual correction
        const empty: BoardDetectionResult = {
          count: 0,
          confidence: 0,
          boards: [],
          timestamp: Date.now(),
        };
        setDetectionResult(empty);
        setLoading(false);
        // Inform user but still allow correction flow
        Alert.alert(
          t('error'),
          'Nta model ya AI irahuza kuri iyi telefone. Shyiramo umubare w\'imbaho wiboneye, hanyuma ukomeze.',
          [
            {text: t('cancel'), style: 'cancel'},
            {text: t('confirm'), onPress: () => navigateToResult(empty, imageUri)},
          ]
        );
        return;
      }
      const result = await woodDetectionService.detectBoards(imageUri);
      setDetectionResult(result);
      // Persist detection + upload image via secure backend
      const compressed = await compressImageUri(imageUri, 1024, 0.75);
      await firebaseService.uploadImage(compressed, `scans/${user?.uid || 'anon'}/${Date.now()}.jpg`).catch(() => {});
      await firebaseService.uploadCameraResult({
        userId: user?.uid,
        businessId: user?.businessId,
        result,
        imageUri,
        timestamp: Date.now(),
      }).catch(() => {});
      if (result.count === 0) {
        Alert.alert(t('error'), t('noBoardsDetected'));
      } else if (result.confidence < 0.5) {
        Alert.alert(t('error'), t('lowConfidence'));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('noBoardsDetected');
      // Show honest error, not fake count
      Alert.alert(t('error'), msg);
      // Still allow manual fallback
      const empty: BoardDetectionResult = {count: 0, confidence: 0, boards: [], timestamp: Date.now()};
      setDetectionResult(empty);
    } finally {
      setLoading(false);
    }
  };

  const navigateToResult = (result: BoardDetectionResult, uri: string) => {
    navigation.navigate('ScanResult', {result, imageUri: uri});
  };

  // ---------- Permission gate ----------
  if (hasCameraPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t('cameraPermissionDenied')}</Text>
        <Text style={styles.permissionHint}>Kamera ntiyemerewe. Jya muri Settings uyemere.</Text>
        <Button title={t('retry')} onPress={requestPermissions} variant="primary" />
        <Button title="Open Settings" onPress={() => Linking.openSettings()} variant="outline" style={{marginTop: SPACING.sm}} />
        <Button title={t('takePhoto') + ' (Gallery)'} onPress={capturePhoto} variant="secondary" style={{marginTop: SPACING.lg}} />
      </View>
    );
  }

  // ---------- Web camera/upload ----------
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>{t('scanBoards')}</Text>
          <Text style={styles.guideText}>{t('scanGuideText')}</Text>
        </View>
        <View style={styles.webCameraBox}>
          {capturedImage ? (
            <Image source={{uri: capturedImage}} style={styles.webPreview} resizeMode="contain" />
          ) : (
            <View style={styles.webPlaceholder}>
              <Text style={styles.webPlaceholderText}>📷</Text>
              <Text style={styles.webPlaceholderSub}>{t('scanGuide')}</Text>
            </View>
          )}
          {detectionResult && <DetectionOverlay result={detectionResult} />}
        </View>
        <View style={styles.webControls}>
          <label style={webStyles.fileLabel as unknown as object}>
            {t('takePhoto')}
            <input type="file" accept="image/*" capture="environment" onChange={handleWebFile as unknown as () => void} style={webStyles.fileInput as unknown as object} />
          </label>
          {capturedImage && detectionResult && (
            <Button
              title={`${t('detectedBoards')}: ${detectionResult.count}  •  ${t('confirm')}`}
              onPress={() => navigateToResult(detectionResult, capturedImage!)}
              variant="primary"
              size="lg"
              style={{marginTop: SPACING.md}}
            />
          )}
          {capturedImage && <Button title={t('retakePhoto')} onPress={() => {setCapturedImage(null); setDetectionResult(null);}} variant="outline" style={{marginTop: SPACING.sm}} />}
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        )}
      </View>
    );
  }

  // ---------- Native camera ----------
  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        {visionAvailable && VisionCamera ? (
          // @ts-ignore – dynamic component
          <VisionCamera
            ref={cameraRef as never}
            style={StyleSheet.absoluteFill}
            device={cameraType}
            isActive={hasCameraPermission === true && !capturedImage}
            photo={true}
            enableZoomGesture={true}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallbackCameraBg]}>
            <Text style={styles.fallbackText}>Kamera izakora nyuma yo gushyira react-native-vision-camera</Text>
            <Text style={styles.fallbackSub}>Koresha Gallery kugira ngo uhitemo ifoto nyayo.</Text>
          </View>
        )}

        {/* Guide frame */}
        <View style={styles.guideFrame} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Text style={styles.guideText}>{t('scanGuideText')}</Text>
        </View>

        {/* Captured preview + boxes */}
        {capturedImage && (
          <View style={StyleSheet.absoluteFill}>
            <Image source={{uri: capturedImage}} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {detectionResult && <DetectionOverlay result={detectionResult} />}
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFlashMode(flashMode === 'on' ? 'off' : 'on')}>
          <Text style={styles.controlIcon}>{flashMode === 'on' ? '⚡' : '💡'}</Text>
          <Text style={styles.controlLabel}>{t('flash')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={capturePhoto} disabled={loading} activeOpacity={0.8}>
          <View style={[styles.captureCircle, loading && styles.captureDisabled]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}>
          <Text style={styles.controlIcon}>🔄</Text>
          <Text style={styles.controlLabel}>{t('switchCamera')}</Text>
        </TouchableOpacity>
      </View>

      {capturedImage && detectionResult && (
        <View style={styles.resultOverlay}>
          <Text style={styles.resultText}>{t('boardsDetected', {count: detectionResult.count})}</Text>
          <Text style={styles.confidenceText}>{Math.round(detectionResult.confidence * 100)}% confidence • {detectionResult.boards.length} bounding boxes</Text>
          <View style={styles.resultActions}>
            <Button title={t('confirm')} onPress={() => navigateToResult(detectionResult, capturedImage!)} variant="primary" style={{flex: 1}} />
            <Button title={t('retakePhoto')} onPress={() => {setCapturedImage(null); setDetectionResult(null);}} variant="outline" style={{flex: 1, marginLeft: SPACING.sm}} />
          </View>
        </View>
      )}
    </View>
  );
}

function DetectionOverlay({result}: {result: BoardDetectionResult}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {result.boards.map(b => (
        <View
          key={b.id}
          style={[
            styles.bbox,
            {
              left: `${b.boundingBox.x * 100}%`,
              top: `${b.boundingBox.y * 100}%`,
              width: `${b.boundingBox.width * 100}%`,
              height: `${b.boundingBox.height * 100}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const webStyles: Record<string, object> = {
  fileLabel: {
    backgroundColor: '#D4A017',
    color: '#1A1A1A',
    padding: '14px 28px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    display: 'inline-block',
    textAlign: 'center',
  } as unknown as object,
  fileInput: {display: 'none'} as unknown as object,
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  permissionContainer: {flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: SPACING.xl, alignItems: 'center'},
  permissionText: {color: COLORS.error, fontSize: FONT_SIZES.lg, textAlign: 'center', marginBottom: SPACING.md, fontWeight: '700'},
  permissionHint: {color: COLORS.textSecondary, fontSize: FONT_SIZES.md, textAlign: 'center', marginBottom: SPACING.xl},
  cameraWrap: {flex: 1, backgroundColor: '#000'},
  fallbackCameraBg: {backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl},
  fallbackText: {color: COLORS.textSecondary, fontSize: FONT_SIZES.md, textAlign: 'center', fontWeight: '600'},
  fallbackSub: {color: COLORS.textMuted, fontSize: FONT_SIZES.sm, textAlign: 'center', marginTop: SPACING.sm},
  guideFrame: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  corner: {position: 'absolute', width: 44, height: 44, borderColor: COLORS.gold, borderWidth: 3},
  topLeft: {top: 80, left: 32, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10},
  topRight: {top: 80, right: 32, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10},
  bottomLeft: {bottom: 180, left: 32, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10},
  bottomRight: {bottom: 180, right: 32, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10},
  guideText: {position: 'absolute', bottom: 120, color: COLORS.cream, fontSize: FONT_SIZES.md, fontWeight: '600', textAlign: 'center', paddingHorizontal: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, borderRadius: 8},
  controls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface},
  controlButton: {alignItems: 'center', padding: SPACING.sm, minWidth: 64},
  controlIcon: {fontSize: 28},
  controlLabel: {fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600'},
  captureButton: {padding: SPACING.sm},
  captureCircle: {width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.gold, borderWidth: 4, borderColor: '#fff', ...SHADOWS.medium},
  captureDisabled: {opacity: 0.5},
  resultOverlay: {position: 'absolute', bottom: 100, left: SPACING.md, right: SPACING.md, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.large, borderWidth: 1, borderColor: COLORS.border},
  resultText: {fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.cream, textAlign: 'center'},
  confidenceText: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs},
  resultActions: {flexDirection: 'row', marginTop: SPACING.md},
  bbox: {position: 'absolute', borderWidth: 2, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 4},
  loadingOverlay: {...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center'},
  loadingText: {color: COLORS.cream, marginTop: SPACING.sm, fontWeight: '600'},
  webHeader: {padding: SPACING.lg, alignItems: 'center'},
  webTitle: {fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.cream},
  webCameraBox: {flex: 1, margin: SPACING.md, backgroundColor: '#111', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', minHeight: 380, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center'},
  webPreview: {width: '100%', height: '100%'},
  webPlaceholder: {alignItems: 'center', padding: SPACING.xl},
  webPlaceholderText: {fontSize: 48, marginBottom: SPACING.md},
  webPlaceholderSub: {color: COLORS.textSecondary, fontSize: FONT_SIZES.md},
  webControls: {padding: SPACING.lg, alignItems: 'center'},
});
