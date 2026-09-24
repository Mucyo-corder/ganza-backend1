import {usePhotoOutput} from 'react-native-vision-camera';
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
  ScrollView,
} from 'react-native';
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
} from 'react-native-vision-camera';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {cameraService} from '../../camera/CameraService';
import {woodDetectionService} from '../../camera/vision/WoodDetectionService';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {SPACING} from '../../constants/theme';
import {BoardDetectionResult} from '../../types';
import {compressImageUri} from '../../utils/formatters';
import {checkPhotoQuality} from '../../utils/photoQuality';

export default function ScanScreen({navigation}: {navigation: {navigate: (s: string, p?: unknown) => void}}) {
  const {user} = useAuth();
  const {t} = useLocalization();
  const {hasPermission, requestPermission} = useCameraPermission();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<BoardDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraMounted, setCameraMounted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const device = useCameraDevice(cameraType);
  const photoOutput = usePhotoOutput();

  useEffect(() => {
    cameraService.setPhotoOutput(photoOutput);
    return () => cameraService.setPhotoOutput(null);
  }, [photoOutput]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setHasCameraPermission(true);
      return;
    }
    requestPermissions();
  }, [hasPermission]);

  const requestPermissions = async () => {
    const ok = hasPermission || await requestPermission();
    setHasCameraPermission(ok);
    if (!ok) {
      Alert.alert(t('error'), t('cameraPermissionDenied'), [
        {text: t('cancel'), style: 'cancel'},
        {text: 'Settings', onPress: () => Linking.openSettings()},
      ]);
    }
  };

  const capturePhoto = useCallback(async () => {
    const cameraIsReady = Boolean(hasCameraPermission) && Boolean(device) && Boolean(photoOutput) && !isCapturing;
    if (loading || isCapturing || !cameraIsReady) {
      if (!cameraIsReady) {
        Alert.alert('Camera ntiraboneka', 'Emeza ko permission yatanzwe kandi camera iri kuri screen.');
      }
      return;
    }
    setLoading(true);
    setIsCapturing(true);
    setQualityWarning(null);
    try {
      let uri: string | null = null;
      if (device && photoOutput) {
        console.log('PHOTO_CAPTURE_STARTED');
        const image = await cameraService.captureImage({flashMode, quality: 'high'});
        console.log('PHOTO_CAPTURE_SUCCESS', image?.uri);
        if (!image) throw new Error(t('backendError'));
        uri = await compressImageUri(image.uri, 1280, 0.8);
        console.log('PHOTO_PATH', uri);
      } else {
        const picked = await cameraService.pickFromLibrary();
        if (!picked) {
          setLoading(false);
          return;
        }
        uri = await compressImageUri(picked.uri, 1280, 0.8);
      }
      setCapturedImage(uri);

      const quality = checkPhotoQuality({requireReference: true, imageUri: uri});
      if (!quality.ok) {
        setQualityWarning(quality.message);
        Alert.alert('Ifoto ntisobanutse neza.', quality.recommendation || 'Ongera ufate ifoto.');
        const empty: BoardDetectionResult = {count: 0, confidence: 0, boards: [], timestamp: Date.now()};
        setDetectionResult(empty);
        navigation.navigate('ScanResult', {result: empty, imageUri: uri, qualityWarning: quality.message});
        return;
      }

      if (quality.needsReference) {
        setQualityWarning('Ibipimo ni ibyagereranyijwe — nta rurerure rugaragaye.');
      }
      await runDetection(uri);
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('backendError');
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
      setIsCapturing(false);
    }
  }, [device, photoOutput, flashMode, loading, navigation, t, hasCameraPermission, cameraMounted, cameraReady, isCapturing]);

  const handleWebFile = async (e: unknown) => {
    const input = e as {target: {files: FileList | null}};
    const file = input.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImage(url);
    setLoading(true);
    try {
      const q = checkPhotoQuality({requireReference: true, imageUri: url});
      if (q.needsReference) setQualityWarning('Ibipimo byagereranijwe — nta rurerure');
      await runDetection(url);
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async (imageUri: string) => {
    console.log('ANALYSIS_STARTED', imageUri);
    setLoading(true);
    setDetectionResult(null);
    try {
      if (woodDetectionService.getModelType() === 'none') {
        const empty: BoardDetectionResult = {count: 0, confidence: 0, boards: [], timestamp: Date.now()};
        setDetectionResult(empty);
        setLoading(false);
        navigation.navigate('ScanResult', {result: empty, imageUri, qualityWarning: 'Nta model ya vision ihari. Shyiramo umubare w\'imbaho wiboneye.'});
        return;
      }
      const result = await woodDetectionService.detectBoards(imageUri);
      setDetectionResult(result);
      const compressed = await compressImageUri(imageUri, 1024, 0.75);
      await firebaseService.uploadImage(compressed, `scans/${user?.uid || 'anon'}/${Date.now()}.jpg`).catch(() => {});
      await firebaseService.uploadCameraResult({userId: user?.uid, businessId: user?.businessId, result, imageUri, timestamp: Date.now()}).catch(() => {});

      if (result.analysisStatus === 'rejected' || result.objectType === 'unsupported_object' || result.count === 0 || result.confidence < 0.5) {
        const warning = result.rejectionReason || 'GANZA ntiyizeye ko iyi foto ari urubaho. Fata ifoto igaragaza urubaho neza.';
        setQualityWarning(warning);
        navigation.navigate('ScanResult', {result, imageUri, qualityWarning: warning});
        return;
      }

      navigation.navigate('ScanResult', {result, imageUri, qualityWarning: qualityWarning || null});
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('noBoardsDetected');
      Alert.alert(t('error'), msg);
      const empty: BoardDetectionResult = {count: 0, confidence: 0, boards: [], timestamp: Date.now()};
      setDetectionResult(empty);
      navigation.navigate('ScanResult', {result: empty, imageUri, qualityWarning: msg});
    } finally {
      setLoading(false);
    }
  };

  const navigateToResult = (result: BoardDetectionResult, uri: string) => {
    navigation.navigate('ScanResult', {result, imageUri: uri, qualityWarning});
  };

  if (hasCameraPermission === false) {
    return (
      <AmbientBackground>
        <ScrollView contentContainerStyle={styles.permissionContainer} showsVerticalScrollIndicator={false}>
          <GanzaHeader variant="compact" />
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconBox}><Text style={styles.permissionIcon}>◈</Text></View>
            <Text style={styles.permissionText}>{t('cameraPermissionDenied')}</Text>
            <Text style={styles.permissionHint}>Kamera ntibyemerewe. Fungura igenamiterere wemeze kamera.</Text>
            <PremiumButton title={t('retry')} onPress={requestPermissions} size="lg" style={{marginTop: 16}} />
            <PremiumButton title="Fungura Igenamiterere" onPress={() => Linking.openSettings()} variant="ghost" style={{marginTop: 8}} />
            <PremiumButton title={t('takePhoto') + ' (Gallery)'} onPress={capturePhoto} variant="secondary" style={{marginTop: 16}} />
          </View>
        </ScrollView>
      </AmbientBackground>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <AmbientBackground>
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
          <GanzaHeader variant="compact" />
          <View style={styles.webHeader}>
            <Text style={styles.webTitle}>{t('scanBoards')}</Text>
            <Text style={styles.webGuide}>{t('scanGuideText')}</Text>
          </View>
          <View style={styles.webCameraBox}>
            {capturedImage ? <Image source={{uri: capturedImage}} style={styles.webPreview} resizeMode="contain" /> : (
              <View style={styles.webPlaceholder}>
                <View style={styles.webPlaceholderIconBox}><Text style={styles.webPlaceholderText}>⬢</Text></View>
                <Text style={styles.webPlaceholderTitle}>Fata ifoto y'imbaho</Text>
                <Text style={styles.webPlaceholderSub}>{t('scanGuide')}</Text>
              </View>
            )}
            {detectionResult && <DetectionOverlay result={detectionResult} />}
          </View>
          {qualityWarning && <View style={styles.qualityBanner}><Text style={styles.qualityText}>{qualityWarning}</Text></View>}
          <View style={styles.webControls}>
            <label style={webStyles.fileLabel as unknown as object}>
              <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={webStyles.fileGrad as unknown as object} />
              <span style={{position: 'relative'}}>{t('takePhoto')}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleWebFile as unknown as () => void} style={webStyles.fileInput as unknown as object} />
            </label>
            {capturedImage && detectionResult && (
              <PremiumButton title={`${t('detectedBoards')}: ${detectionResult.count}  •  ${t('confirm')}`} onPress={() => navigateToResult(detectionResult, capturedImage!)} size="lg" style={{marginTop: 12, width: '100%'}} />
            )}
            {capturedImage && <PremiumButton title={t('retakePhoto')} onPress={() => {setCapturedImage(null); setDetectionResult(null); setQualityWarning(null);}} variant="ghost" style={{marginTop: 8, width: '100%'}} />}
          </View>
          {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#60A5FA" /><Text style={styles.loadingText}>{t('loading')}</Text></View>}
        </ScrollView>
      </AmbientBackground>
    );
  }

  return (
    <AmbientBackground>
      <View style={styles.container}>
        {/* Header scrolls? In this screen header is above camera, camera takes rest — header itself is NOT fixed inside cameraWrap */}
        <GanzaHeader variant="compact" />
        <View style={styles.cameraWrap}>
          {device ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              outputs={[photoOutput]}
              isActive={hasCameraPermission === true && !capturedImage}
              onError={(error) => {
                console.warn('VISION_CAMERA_ERROR', error);
                setCameraReady(false);
                setCameraMounted(false);
              }}
              onStarted={() => {
                setCameraMounted(true);
                setCameraReady(true);
              }}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.fallbackCameraBg]}>
              <View style={styles.fallbackIconBox}><Text style={styles.fallbackIcon}>⬢</Text></View>
              <Text style={styles.fallbackTitle}>Fata ifoto y'imbaho</Text>
              <Text style={styles.fallbackSub}>Hitamo ifoto — GANZA izabara imbaho</Text>
              <PremiumButton title="Hitamo ifoto" onPress={capturePhoto} size="lg" style={{marginTop: 16, minWidth: 180}} />
            </View>
          )}

          <View style={styles.guideFrame} pointerEvents="none">
            <View style={styles.guideTop}>
              <View style={styles.guidePill}><View style={styles.guideDot} /><Text style={styles.guidePillText}>Fata ifoto • Shyira imbaho hagati neza</Text></View>
            </View>
            <View style={styles.frameBox}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.guideBottom}>
              <Text style={styles.guideText}>{t('scanGuideText')}</Text>
              <Text style={styles.guideSub}>Shyira rurerure hafi y'imbaho niba ushaka ibipimo nyabyo</Text>
            </View>
          </View>

          {capturedImage && (
            <View style={StyleSheet.absoluteFill}>
              <Image source={{uri: capturedImage}} style={StyleSheet.absoluteFill} resizeMode="cover" />
              {detectionResult && <DetectionOverlay result={detectionResult} />}
              <View style={styles.captureScrim} />
            </View>
          )}

          {loading && <View style={styles.loadingOverlay}><View style={styles.loadingCard}><ActivityIndicator size="large" color="#60A5FA" /><Text style={styles.loadingText}>Turimo gusesengura ifoto...</Text><Text style={styles.loadingSub}>Turimo kubara imbaho</Text></View></View>}
        </View>

        {qualityWarning && (
          <View style={styles.qualityBanner}><Text style={styles.qualityText}>{qualityWarning}</Text></View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setFlashMode(flashMode === 'on' ? 'off' : 'on')} activeOpacity={0.8}>
            <View style={[styles.controlIconBox, flashMode === 'on' && styles.controlIconActive]}><Text style={styles.controlIcon}>{flashMode === 'on' ? '⚡' : '◈'}</Text></View>
            <Text style={styles.controlLabel}>{t('flash')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={capturePhoto}
            disabled={loading || isCapturing || !device || hasCameraPermission !== true}
            activeOpacity={0.88}
          >
            <View style={styles.captureOuter}>
              <LinearGradient
                colors={(!cameraReady || !cameraMounted || !device || hasCameraPermission !== true) ? ['#4B4B4B', '#2B2B2B'] : ['#F5F5F5', '#D9D9D9']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.captureGradient}
              >
                <View style={styles.captureInner} />
              </LinearGradient>
            </View>
            <Text style={styles.captureLabel}>Fata ifoto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')} activeOpacity={0.8}>
            <View style={styles.controlIconBox}><Text style={styles.controlIcon}>⬡</Text></View>
            <Text style={styles.controlLabel}>{t('switchCamera')}</Text>
          </TouchableOpacity>
        </View>

        {capturedImage && detectionResult && (
          <View style={styles.resultOverlay}>
            <View style={styles.resultTopRow}>
              <View style={styles.resultIconBox}><Text style={styles.resultIcon}>⬢</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.resultText}>{t('boardsDetected', {count: detectionResult.count})}</Text>
                <Text style={styles.confidenceText}>{Math.round(detectionResult.confidence * 100)}% confidence • {detectionResult.boards.length} boxes</Text>
              </View>
            </View>
            <View style={styles.resultActions}>
              <PremiumButton title={t('confirm')} onPress={() => navigateToResult(detectionResult, capturedImage!)} style={{flex: 1}} size="md" />
              <PremiumButton title={t('retakePhoto')} onPress={() => {setCapturedImage(null); setDetectionResult(null); setQualityWarning(null);}} variant="ghost" style={{flex: 1, marginLeft: 8}} size="md" />
            </View>
            {qualityWarning && <Text style={styles.qualityHint}>Fata indi foto isobanutse niba confidence iri hasi</Text>}
          </View>
        )}
      </View>
    </AmbientBackground>
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
  permissionContainer: {flex: 1, backgroundColor: '#040A1B', justifyContent: 'center', padding: SPACING.xl, alignItems: 'center', minHeight: 600},
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
  fallbackSub: {color: '#6B84A0', fontSize: 12, textAlign: 'center', marginTop: 6},
  guideFrame: {flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20},
  guideTop: {alignItems: 'center'},
  guidePill: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)'},
  guideDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA', marginRight: 6},
  guidePillText: {fontSize: 10, fontWeight: '700', color: '#EAF2FD', letterSpacing: 0.4, textTransform: 'uppercase'},
  frameBox: {width: 280, height: 280, position: 'relative', justifyContent: 'center', alignItems: 'center'},
  corner: {position: 'absolute', width: 32, height: 32, borderColor: 'rgba(96,165,250,0.95)', borderWidth: 1.5},
  topLeft: {top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14},
  topRight: {top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14},
  bottomLeft: {bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14},
  bottomRight: {bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14},
  guideBottom: {alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  guideText: {color: '#F1F6FF', fontSize: 12, fontWeight: '700', textAlign: 'center'},
  guideSub: {color: '#8FA2BB', fontSize: 11, textAlign: 'center', marginTop: 3},
  captureScrim: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,10,27,0.12)'},
  controls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 12, backgroundColor: 'rgba(5,10,27,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)'},
  controlButton: {alignItems: 'center', minWidth: 64},
  controlIconBox: {width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center'},
  controlIconActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.22)'},
  controlIcon: {fontSize: 16, color: '#CBD8E6'},
  controlLabel: {fontSize: 10, color: '#8FA2BB', marginTop: 6, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase'},
  captureButton: {alignItems: 'center'},
  captureOuter: {width: 72, height: 72, borderRadius: 36, padding: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)'},
  captureGradient: {flex: 1, borderRadius: 33, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  captureInner: {width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)'},
  captureLabel: {fontSize: 10, fontWeight: '800', color: '#93C5FD', marginTop: 6, letterSpacing: 0.6, textTransform: 'uppercase'},
  resultOverlay: {position: 'absolute', bottom: 96, left: 12, right: 12, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden', backgroundColor: 'rgba(8,16,38,0.88)'},
  resultTopRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  resultIconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.14)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  resultIcon: {fontSize: 14, color: '#93C5FD'},
  resultText: {fontSize: 14, fontWeight: '800', color: '#F1F6FF'},
  confidenceText: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  resultActions: {flexDirection: 'row'},
  qualityBanner: {backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'center'},
  qualityText: {fontSize: 11, color: '#FCD34D', fontWeight: '600', textAlign: 'center'},
  qualityHint: {fontSize: 11, color: '#8FA2BB', marginTop: 8, textAlign: 'center'},
  bbox: {position: 'absolute', borderWidth: 1.5, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.10)', borderRadius: 6},
  loadingOverlay: {...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,10,27,0.68)', justifyContent: 'center', alignItems: 'center'},
  loadingCard: {padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', minWidth: 200},
  loadingText: {color: '#F1F6FF', marginTop: 12, fontWeight: '700', fontSize: 13},
  loadingSub: {color: '#8FA2BB', marginTop: 4, fontSize: 11},
  webHeader: {padding: 16, alignItems: 'center'},
  webTitle: {fontSize: 22, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.4},
  webGuide: {fontSize: 12, color: '#8FA2BB', marginTop: 4},
  webCameraBox: {flex: 1, margin: 12, backgroundColor: '#0A1930', borderRadius: 20, overflow: 'hidden', minHeight: 380, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', position: 'relative'},
  webPreview: {width: '100%', height: '100%'},
  webPlaceholder: {alignItems: 'center', padding: 32},
  webPlaceholderIconBox: {width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  webPlaceholderText: {fontSize: 24, color: '#93C5FD'},
  webPlaceholderTitle: {fontSize: 14, fontWeight: '800', color: '#F1F6FF'},
  webPlaceholderSub: {color: '#8FA2BB', fontSize: 12, marginTop: 4, textAlign: 'center'},
  webControls: {padding: 16, alignItems: 'center'},
});
