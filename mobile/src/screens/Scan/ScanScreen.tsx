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
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {cameraService} from '../../camera/CameraService';
import {woodDetectionService} from '../../camera/vision/WoodDetectionService';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {GlassCard} from '../../components/premium/GlassCard';
import {SPACING, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';
import {BoardDetectionResult} from '../../types';
import {compressImageUri} from '../../utils/formatters';

let VisionCamera: unknown = null;
try {
  const cam = require('react-native-vision-camera');
  VisionCamera = cam.Camera;
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

  useEffect(() => {
    setVisionAvailable(!!VisionCamera);
    if (Platform.OS === 'web') {
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
      if (VisionCamera && cameraRef.current) {
        cameraService.setCameraRef(cameraRef.current);
        const image = await cameraService.captureImage({flashMode, quality: 'high'});
        if (!image) throw new Error(t('backendError'));
        const compressed = await compressImageUri(image.uri, 1280, 0.8);
        setCapturedImage(compressed);
        await runDetection(compressed);
        return;
      }
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
        const empty: BoardDetectionResult = {count: 0, confidence: 0, boards: [], timestamp: Date.now()};
        setDetectionResult(empty);
        setLoading(false);
        Alert.alert(t('error'), 'Nta model ya AI irahuza kuri iyi telefone. Shyiramo umubare w\'imbaho wiboneye, hanyuma ukomeze.', [
          {text: t('cancel'), style: 'cancel'},
          {text: t('confirm'), onPress: () => navigateToResult(empty, imageUri)},
        ]);
        return;
      }
      const result = await woodDetectionService.detectBoards(imageUri);
      setDetectionResult(result);
      const compressed = await compressImageUri(imageUri, 1024, 0.75);
      await firebaseService.uploadImage(compressed, `scans/${user?.uid || 'anon'}/${Date.now()}.jpg`).catch(() => {});
      await firebaseService.uploadCameraResult({userId: user?.uid, businessId: user?.businessId, result, imageUri, timestamp: Date.now()}).catch(() => {});
      if (result.count === 0) Alert.alert(t('error'), t('noBoardsDetected'));
      else if (result.confidence < 0.5) Alert.alert(t('error'), t('lowConfidence'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('noBoardsDetected');
      Alert.alert(t('error'), msg);
      const empty: BoardDetectionResult = {count: 0, confidence: 0, boards: [], timestamp: Date.now()};
      setDetectionResult(empty);
    } finally {
      setLoading(false);
    }
  };

  const navigateToResult = (result: BoardDetectionResult, uri: string) => {
    navigation.navigate('ScanResult', {result, imageUri: uri});
  };

  if (hasCameraPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconBox}><Text style={styles.permissionIcon}>◈</Text></View>
          <Text style={styles.permissionText}>{t('cameraPermissionDenied')}</Text>
          <Text style={styles.permissionHint}>Kamera ntiyemerewe. Jya muri Settings uyemere.</Text>
          <PremiumButton title={t('retry')} onPress={requestPermissions} size="lg" style={{marginTop: 16}} />
          <PremiumButton title="Open Settings" onPress={() => Linking.openSettings()} variant="ghost" style={{marginTop: 8}} />
          <PremiumButton title={t('takePhoto') + ' (Gallery)'} onPress={capturePhoto} variant="secondary" style={{marginTop: 16}} />
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <GanzaHeader variant="compact" />
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>{t('scanBoards')}</Text>
          <Text style={styles.webGuide}>{t('scanGuideText')} • AI Vision</Text>
        </View>
        <View style={styles.webCameraBox}>
          {capturedImage ? <Image source={{uri: capturedImage}} style={styles.webPreview} resizeMode="contain" /> : (
            <View style={styles.webPlaceholder}>
              <LinearGradient colors={['rgba(59,130,246,0.12)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={styles.webPlaceholderGlow} />
              <View style={styles.webPlaceholderIconBox}><Text style={styles.webPlaceholderText}>⬢</Text></View>
              <Text style={styles.webPlaceholderTitle}>GANZA AI Vision</Text>
              <Text style={styles.webPlaceholderSub}>{t('scanGuide')}</Text>
            </View>
          )}
          {detectionResult && <DetectionOverlay result={detectionResult} />}
        </View>
        <View style={styles.webControls}>
          <label style={webStyles.fileLabel as unknown as object}>
            <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={webStyles.fileGrad as unknown as object} />
            <span style={{position: 'relative'}}>{t('takePhoto')}</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleWebFile as unknown as () => void} style={webStyles.fileInput as unknown as object} />
          </label>
          {capturedImage && detectionResult && (
            <PremiumButton title={`${t('detectedBoards')}: ${detectionResult.count}  •  ${t('confirm')}`} onPress={() => navigateToResult(detectionResult, capturedImage!)} size="lg" style={{marginTop: 12, width: '100%'}} />
          )}
          {capturedImage && <PremiumButton title={t('retakePhoto')} onPress={() => {setCapturedImage(null); setDetectionResult(null);}} variant="ghost" style={{marginTop: 8, width: '100%'}} />}
        </View>
        {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#60A5FA" /><Text style={styles.loadingText}>{t('loading')}</Text></View>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GanzaHeader variant="compact" />
      <View style={styles.cameraWrap}>
        {visionAvailable && VisionCamera ? (
          // @ts-ignore
          <VisionCamera ref={cameraRef as never} style={StyleSheet.absoluteFill} device={cameraType} isActive={hasCameraPermission === true && !capturedImage} photo enableZoomGesture />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallbackCameraBg]}>
            <View style={styles.fallbackIconBox}><Text style={styles.fallbackIcon}>⬢</Text></View>
            <Text style={styles.fallbackTitle}>GANZA AI Vision</Text>
            <Text style={styles.fallbackText}>Kamera izakora nyuma yo gushyira react-native-vision-camera</Text>
            <Text style={styles.fallbackSub}>Koresha Gallery kugira ngo uhitemo ifoto nyayo.</Text>
            <PremiumButton title="Hitamo ifoto" onPress={capturePhoto} size="lg" style={{marginTop: 16, minWidth: 180}} />
          </View>
        )}

        {/* Premium guide frame — thin luminous borders */}
        <View style={styles.guideFrame} pointerEvents="none">
          <View style={styles.guideTop}>
            <View style={styles.guidePill}><View style={styles.guideDot} /><Text style={styles.guidePillText}>AI Vision • Auto-detect</Text></View>
          </View>
          <View style={styles.frameBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.frameInnerGlow} />
          </View>
          <View style={styles.guideBottom}>
            <Text style={styles.guideText}>{t('scanGuideText')}</Text>
            <Text style={styles.guideSub}>Shyira imbaho neza • AI irabara automatically</Text>
          </View>
        </View>

        {capturedImage && (
          <View style={StyleSheet.absoluteFill}>
            <Image source={{uri: capturedImage}} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {detectionResult && <DetectionOverlay result={detectionResult} />}
            <View style={styles.captureScrim} />
          </View>
        )}

        {loading && <View style={styles.loadingOverlay}><View style={styles.loadingCard}><ActivityIndicator size="large" color="#60A5FA" /><Text style={styles.loadingText}>AI irasesengura...</Text><Text style={styles.loadingSub}>Kubara imbaho • Confidence check</Text></View></View>}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFlashMode(flashMode === 'on' ? 'off' : 'on')} activeOpacity={0.8}>
          <View style={[styles.controlIconBox, flashMode === 'on' && styles.controlIconActive]}><Text style={styles.controlIcon}>{flashMode === 'on' ? '⚡' : '◈'}</Text></View>
          <Text style={styles.controlLabel}>{t('flash')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={capturePhoto} disabled={loading} activeOpacity={0.88}>
          <View style={styles.captureOuter}>
            <LinearGradient colors={['#60A5FA', '#2563EB'] as unknown as string[]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.captureGradient}>
              <View style={styles.captureInner} />
              <View style={styles.captureSheen} />
            </LinearGradient>
          </View>
          <Text style={styles.captureLabel}>Fata</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')} activeOpacity={0.8}>
          <View style={styles.controlIconBox}><Text style={styles.controlIcon}>⬡</Text></View>
          <Text style={styles.controlLabel}>{t('switchCamera')}</Text>
        </TouchableOpacity>
      </View>

      {capturedImage && detectionResult && (
        <View style={styles.resultOverlay}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'] as unknown as string[]} style={StyleSheet.absoluteFill} />
          <View style={styles.resultTopRow}>
            <View style={styles.resultIconBox}><Text style={styles.resultIcon}>⬢</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.resultText}>{t('boardsDetected', {count: detectionResult.count})}</Text>
              <Text style={styles.confidenceText}>{Math.round(detectionResult.confidence * 100)}% confidence • {detectionResult.boards.length} bounding boxes • AI Vision</Text>
            </View>
          </View>
          <View style={styles.resultActions}>
            <PremiumButton title={t('confirm')} onPress={() => navigateToResult(detectionResult, capturedImage!)} style={{flex: 1}} size="md" />
            <PremiumButton title={t('retakePhoto')} onPress={() => {setCapturedImage(null); setDetectionResult(null);}} variant="ghost" style={{flex: 1, marginLeft: 8}} size="md" />
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
        >
          <View style={styles.bboxCorner} />
        </View>
      ))}
    </View>
  );
}

const webStyles: Record<string, object> = {
  fileLabel: {
    position: 'relative',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '14px',
    cursor: 'pointer',
    fontWeight: '800',
    display: 'inline-block',
    textAlign: 'center',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.14)',
  } as unknown as object,
  fileGrad: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0} as unknown as object,
  fileInput: {display: 'none'} as unknown as object,
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#040A1B'},
  permissionContainer: {flex: 1, backgroundColor: '#040A1B', justifyContent: 'center', padding: SPACING.xl, alignItems: 'center'},
  permissionCard: {width: '100%', maxWidth: 360, padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center'},
  permissionIconBox: {width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.16)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  permissionIcon: {fontSize: 18, color: '#FCA5A5'},
  permissionText: {color: '#F1F6FF', fontSize: 14, textAlign: 'center', fontWeight: '700'},
  permissionHint: {color: '#8FA2BB', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 16},
  cameraWrap: {flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden'},
  fallbackCameraBg: {backgroundColor: '#0A1930', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl},
  fallbackIconBox: {width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  fallbackIcon: {fontSize: 22, color: '#93C5FD'},
  fallbackTitle: {color: '#F1F6FF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4},
  fallbackText: {color: '#8FA2BB', fontSize: 13, textAlign: 'center', fontWeight: '600', marginTop: 8},
  fallbackSub: {color: '#6B84A0', fontSize: 12, textAlign: 'center', marginTop: 6},
  guideFrame: {flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20},
  guideTop: {alignItems: 'center'},
  guidePill: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)'},
  guideDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA', marginRight: 6},
  guidePillText: {fontSize: 10, fontWeight: '700', color: '#EAF2FD', letterSpacing: 0.5, textTransform: 'uppercase'},
  frameBox: {width: 280, height: 280, position: 'relative', justifyContent: 'center', alignItems: 'center'},
  frameInnerGlow: {position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderWidth: 1, borderColor: 'rgba(96,165,250,0.06)', borderRadius: 16},
  corner: {position: 'absolute', width: 36, height: 36, borderColor: 'rgba(96,165,250,0.95)', borderWidth: 2, shadowColor: '#60A5FA', shadowOpacity: 0.35, shadowRadius: 8},
  topLeft: {top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16},
  topRight: {top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16},
  bottomLeft: {bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16},
  bottomRight: {bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16},
  guideBottom: {alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  guideText: {color: '#F1F6FF', fontSize: 13, fontWeight: '700', textAlign: 'center'},
  guideSub: {color: '#8FA2BB', fontSize: 11, textAlign: 'center', marginTop: 4},
  captureScrim: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,10,27,0.12)'},
  controls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: 'rgba(5,10,27,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)'},
  controlButton: {alignItems: 'center', minWidth: 64},
  controlIconBox: {width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center'},
  controlIconActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.22)'},
  controlIcon: {fontSize: 16, color: '#CBD8E6'},
  controlLabel: {fontSize: 10, color: '#8FA2BB', marginTop: 6, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase'},
  captureButton: {alignItems: 'center'},
  captureOuter: {width: 72, height: 72, borderRadius: 36, padding: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)'},
  captureGradient: {flex: 1, borderRadius: 33, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'},
  captureInner: {width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)'},
  captureSheen: {position: 'absolute', top: 0, left: 0, right: 0, height: 18, backgroundColor: 'rgba(255,255,255,0.18)'},
  captureLabel: {fontSize: 10, fontWeight: '800', color: '#93C5FD', marginTop: 6, letterSpacing: 0.6, textTransform: 'uppercase'},
  resultOverlay: {position: 'absolute', bottom: 96, left: 12, right: 12, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden', backgroundColor: 'rgba(8,16,38,0.78)'},
  resultTopRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  resultIconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.14)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  resultIcon: {fontSize: 14, color: '#93C5FD'},
  resultText: {fontSize: 14, fontWeight: '800', color: '#F1F6FF'},
  confidenceText: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  resultActions: {flexDirection: 'row'},
  bbox: {position: 'absolute', borderWidth: 1.5, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.10)', borderRadius: 6, shadowColor: '#60A5FA', shadowOpacity: 0.35, shadowRadius: 6},
  bboxCorner: {position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#93C5FD', borderTopLeftRadius: 6},
  loadingOverlay: {...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,10,27,0.72)', justifyContent: 'center', alignItems: 'center'},
  loadingCard: {padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', minWidth: 200},
  loadingText: {color: '#F1F6FF', marginTop: 12, fontWeight: '700', fontSize: 13},
  loadingSub: {color: '#8FA2BB', marginTop: 4, fontSize: 11},
  webHeader: {padding: 16, alignItems: 'center'},
  webTitle: {fontSize: 22, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.4},
  webGuide: {fontSize: 12, color: '#8FA2BB', marginTop: 4},
  webCameraBox: {flex: 1, margin: 12, backgroundColor: '#0A1930', borderRadius: 20, overflow: 'hidden', minHeight: 380, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', position: 'relative'},
  webPreview: {width: '100%', height: '100%'},
  webPlaceholder: {alignItems: 'center', padding: 32, position: 'relative'},
  webPlaceholderGlow: {position: 'absolute', top: -40, left: -40, right: -40, height: 160, borderRadius: 80, opacity: 0.5},
  webPlaceholderIconBox: {width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  webPlaceholderText: {fontSize: 24, color: '#93C5FD'},
  webPlaceholderTitle: {fontSize: 14, fontWeight: '800', color: '#F1F6FF', letterSpacing: 0.4},
  webPlaceholderSub: {color: '#8FA2BB', fontSize: 12, marginTop: 4, textAlign: 'center'},
  webControls: {padding: 16, alignItems: 'center'},
});
