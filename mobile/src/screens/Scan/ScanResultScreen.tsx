import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform, TextInput} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {SPACING} from '../../constants/theme';
import {BoardDetectionResult} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';
import {calculatePrice, priceLabel, DEFAULT_PRICE_CONFIG, PriceConfig} from '../../utils/pricing';
import {volumeOnePieceM3, formatDimensions, formatVolume, formatArea, MeasurementMethod, MEASUREMENT_LABEL, validateDimensions} from '../../utils/woodMath';

interface Props {
  route: {params: {result: BoardDetectionResult; imageUri: string; qualityWarning?: string | null}};
  navigation: {goBack: () => void; navigate: (s: string) => void};
}

export default function ScanResultScreen({route, navigation}: Props) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const {result, imageUri, qualityWarning} = route.params;
  const hasReliableDetection = result.count > 0 && result.boards.length > 0 && result.confidence > 0;

  // User correction state
  const [quantity, setQuantity] = useState<number>(result.count);
  const [woodType, setWoodType] = useState<string>('Pine');
  const [lengthM, setLengthM] = useState<string>('');
  const [widthM, setWidthM] = useState<string>('');
  const [thicknessM, setThicknessM] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(result.confidence);
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('estimated');
  const [hasReference, setHasReference] = useState(false);
  const [priceBasis, setPriceBasis] = useState<PriceConfig['basis']>(DEFAULT_PRICE_CONFIG.basis);
  const [pricePerUnit, setPricePerUnit] = useState<string>(String(DEFAULT_PRICE_CONFIG.valuePerUnit));
  const [saving, setSaving] = useState(false);

  const isUserCorrected = quantity !== result.count || measurementMethod !== 'estimated';
  const numericLength = parseFloat(lengthM) || 0;
  const numericWidth = parseFloat(widthM) || 0;
  const numericThickness = parseFloat(thicknessM) || 0;
  const numericPrice = parseFloat(pricePerUnit.replace(/[^\d.]/g, '')) || 0;

  // Dimensions sanity
  const dimsValid = validateDimensions({length: numericLength, width: numericWidth, thickness: numericThickness}) === null;
  const oneVolume = dimsValid ? numericLength * numericWidth * numericThickness : 0;
  const totalVolume = dimsValid ? oneVolume * quantity : 0;
  const totalArea = dimsValid ? numericLength * numericWidth * quantity : 0;
  const totalLen = dimsValid ? numericLength * quantity : 0;

  const pricingResult = useMemo(() => {
    return calculatePrice(
      {basis: priceBasis, valuePerUnit: numericPrice},
      {pieces: quantity, totalLengthM: totalLen, totalAreaM2: totalArea, totalVolumeM3: totalVolume}
    );
  }, [priceBasis, numericPrice, quantity, totalLen, totalArea, totalVolume]);

  const estimatedLabel = !hasReference || measurementMethod === 'estimated'
    ? 'Estimated measurement'
    : MEASUREMENT_LABEL[measurementMethod];

  const adjustQuantity = (delta: number) => setQuantity(q => Math.max(0, q + delta));

  const saveToInventory = async () => {
    if (!numericPrice || numericPrice <= 0) {
      Alert.alert(t('error'), `${t('unitPrice')} – shyiramo igiciro nyacyo (>0)`);
      return;
    }
    if (quantity <= 0) {
      Alert.alert(t('error'), "Umubare w'imbaho ugomba kuba hejuru ya 0");
      return;
    }
    if (!dimsValid) {
      Alert.alert(t('error'), 'Ibipimo ntibisobanutse — zuza length/width/thickness');
      return;
    }
    if (!hasReliableDetection && !isUserCorrected) {
      Alert.alert(t('error'), 'Nta model yemewe yagaragaje imbaho. Injiza umubare n\'ibipimo byapimwe mbere yo kubika.');
      return;
    }
    setSaving(true);
    try {
      const detectionResult = {...result, count: quantity, confidence, boards: result.boards.slice(0, quantity)};
      const dimensions = {
        length: numericLength,
        width: numericWidth,
        thickness: numericThickness,
        displayStr: `${numericLength.toFixed(1)} × ${numericWidth.toFixed(2)} × ${numericThickness.toFixed(2)} m`,
      };
      const inventoryItem: any = {
        id: `inv-${Date.now()}`,
        businessId: user?.businessId || user?.uid || 'default-business',
        name: `${woodType} (${dimensions.displayStr})`,
        category: woodType,
        woodType,
        quantity,
        unit: 'pieces',
        unitPrice: priceBasis === 'piece' ? Math.round(numericPrice) : Math.round(pricingResult.totalRWF / Math.max(1, quantity)),
        totalValue: pricingResult.totalRWF,
        priceBasis,
        pricePerUnit: Math.round(numericPrice),
        imageUrl: imageUri,
        detectionResult,
        dimensions,
        volumeM3: totalVolume,
        areaM2: totalArea,
        totalLengthM: totalLen,
        measurementMethod: hasReference ? measurementMethod : 'estimated',
        confidence,
        source: hasReliableDetection ? 'scan' : 'manual',
        isUserCorrected,
        syncStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await firebaseService.saveInventoryItem(inventoryItem);
      Alert.alert('Bika', `Byabitswe: ${quantity} imbaho • ${formatVolume(totalVolume)} • ${formatRWF(pricingResult.totalRWF)}`);
      navigation.goBack();
      // go to inventory after
      setTimeout(() => navigation.navigate('Inventory'), 400);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('backendError');
      Alert.alert(t('error'), msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AmbientBackground>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header scrolls with content */}
        <GanzaHeader variant="compact" />

        <Text style={styles.title}>GANZA RESULT</Text>
        <Text style={styles.subtitle}>Review • Edit • Save to stock</Text>

        {/* Photo */}
        <View style={styles.imageCard}>
          <Image source={{uri: imageUri}} style={styles.image} resizeMode="cover" />
          <View style={styles.boxesOverlay} pointerEvents="none">
            {result.boards.slice(0, quantity).map(b => (
              <View key={b.id} style={[styles.bbox, {left: `${b.boundingBox.x * 100}%`, top: `${b.boundingBox.y * 100}%`, width: `${b.boundingBox.width * 100}%`, height: `${b.boundingBox.height * 100}%`}]} />
            ))}
          </View>
          <LinearGradient colors={['rgba(0,0,0,0.00)', 'rgba(4,10,27,0.72)'] as unknown as string[]} style={styles.imageScrim} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Detected {quantity} imbaho {isUserCorrected ? '• Byahinduwe' : `• ${Math.round(confidence * 100)}%`}</Text>
            <Text style={styles.imageLabelSub}>{estimatedLabel}</Text>
          </View>
        </View>

        {qualityWarning && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{qualityWarning}</Text>
            <Text style={styles.warningSub}>Fata indi foto isobanutse niba ukoresha ruler.</Text>
            <TouchableOpacity style={styles.warningBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.warningBtnText}>Fata ifoto nanone</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Detected + counting correction */}
        <GlassCard title="Imbaho zagaragaye" subtitle="Detected • Kosora umubare niba bikenewe" icon="⬢" style={{marginBottom: 12}}>
          <View style={styles.countContainer}>
            <TouchableOpacity style={styles.countButton} onPress={() => adjustQuantity(-1)} activeOpacity={0.85}><Text style={styles.countButtonText}>−</Text></TouchableOpacity>
            <View style={styles.countCenter}>
              <Text style={styles.countNumber}>{quantity}</Text>
              <StatusPill status={isUserCorrected ? 'warning' : confidence > 0.7 ? 'success' : 'warning'} label={isUserCorrected ? 'Byahinduwe' : `${Math.round(confidence * 100)}% confidence`} />
            </View>
            <TouchableOpacity style={styles.countButtonPrimary} onPress={() => adjustQuantity(1)} activeOpacity={0.88}>
              <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={StyleSheet.absoluteFill} />
              <Text style={[styles.countButtonText, {color: '#fff'}]}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickAdjust}>
            {[1, 5, 10].map(n => (
              <TouchableOpacity key={n} style={styles.quickBtn} onPress={() => adjustQuantity(n)} activeOpacity={0.85}><Text style={styles.quickText}>+{n}</Text></TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.quickBtnGhost} onPress={() => setQuantity(result.count)} activeOpacity={0.85}><Text style={styles.quickTextGhost}>Reset</Text></TouchableOpacity>
          </View>
          {confidence < 0.5 && quantity > 0 && <Text style={styles.lowConfidence}>Confidence iri hasi — Birasaba kugenzura.</Text>}
          {quantity === 0 && <Text style={styles.lowConfidence}>Nta mbaho zagaragaye — shyiramo umubare manually.</Text>}
        </GlassCard>

        {/* Wood type */}
        <GlassCard title="Ubwoko bw'igiti" subtitle="Wood type • Hindura niba bikenewe" icon="⬡" style={{marginBottom: 12}}>
          <View style={styles.chipRow}>
            {['Pine', 'Eucalyptus', 'Teak', 'Cypress', 'Mahogany'].map(w => (
              <TouchableOpacity key={w} style={[styles.chip, woodType === w && styles.chipActive]} onPress={() => setWoodType(w)} activeOpacity={0.85}>
                <Text style={[styles.chipText, woodType === w && styles.chipTextActive]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Dimensions — honest labeling */}
        <GlassCard title="Ibipimo" subtitle={estimatedLabel + ' • Shyira reference kugira ngo bibe exact'} icon="◆" style={{marginBottom: 12}}>
          <View style={styles.dimRow}>
            <View style={styles.dimField}>
              <Text style={styles.dimLabel}>Length (m)</Text>
              <TextInput style={styles.dimInput} value={lengthM} onChangeText={setLengthM} keyboardType={Platform.OS === 'web' ? 'default' : 'decimal-pad'} placeholder="3.0" placeholderTextColor="#5E728C" />
            </View>
            <View style={styles.dimField}>
              <Text style={styles.dimLabel}>Width (m)</Text>
              <TextInput style={styles.dimInput} value={widthM} onChangeText={setWidthM} keyboardType={Platform.OS === 'web' ? 'default' : 'decimal-pad'} placeholder="0.20" placeholderTextColor="#5E728C" />
            </View>
            <View style={styles.dimField}>
              <Text style={styles.dimLabel}>Thick. (m)</Text>
              <TextInput style={styles.dimInput} value={thicknessM} onChangeText={setThicknessM} keyboardType={Platform.OS === 'web' ? 'default' : 'decimal-pad'} placeholder="0.05" placeholderTextColor="#5E728C" />
            </View>
          </View>
          <View style={styles.referenceRow}>
            <TouchableOpacity
              style={[styles.refChip, hasReference && styles.refChipActive]}
              onPress={() => { setHasReference(!hasReference); setMeasurementMethod(!hasReference ? 'reference_ruler' : 'estimated'); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.refText, hasReference && styles.refTextActive]}>{hasReference ? '✓ Hari rurerure' : '○ Nta rurerure'}</Text>
            </TouchableOpacity>
            {hasReference && (
              <View style={styles.refOptions}>
                {(['reference_ruler', 'reference_object', 'ar_depth', 'manual'] as MeasurementMethod[]).map(m => (
                  <TouchableOpacity key={m} style={[styles.refMini, measurementMethod === m && styles.refMiniActive]} onPress={() => setMeasurementMethod(m)} activeOpacity={0.85}>
                    <Text style={[styles.refMiniText, measurementMethod === m && styles.refMiniTextActive]}>{m === 'reference_ruler' ? 'Rurerure' : m === 'reference_object' ? 'Object' : m === 'ar_depth' ? 'AR' : 'Manual'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {!hasReference && <Text style={styles.estimatedHint}>⚠ Measurement requires a reference — ibipimo biri hejuru ni estimated gusa. Shyira ruler muri foto ikurikira.</Text>}
          {dimsValid && (
            <View style={styles.calcBox}>
              <Text style={styles.calcLabel}>Volume (one): {formatVolume(oneVolume)}</Text>
              <Text style={styles.calcLabel}>Volume (total): {formatVolume(totalVolume)} • Area: {formatArea(totalArea)} • Length: {totalLen.toFixed(2)} m</Text>
              <Text style={styles.calcFormula}>Formula: {numericLength.toFixed(2)} × {numericWidth.toFixed(2)} × {numericThickness.toFixed(2)} × {quantity} = {formatVolume(totalVolume)}</Text>
            </View>
          )}
        </GlassCard>

        {/* Pricing */}
        <GlassCard title="Igiciro" subtitle="Pricing • Hitamo basis" icon="◆" style={{marginBottom: 12}}>
          <View style={styles.priceBasisRow}>
            {(['piece', 'm', 'm2', 'm3'] as const).map(b => (
              <TouchableOpacity key={b} style={[styles.basisChip, priceBasis === b && styles.basisChipActive]} onPress={() => setPriceBasis(b)} activeOpacity={0.85}>
                <Text style={[styles.basisText, priceBasis === b && styles.basisTextActive]}>{priceLabel(b)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>RWF</Text>
            <TextInput style={styles.priceInput} value={pricePerUnit} onChangeText={v => setPricePerUnit(v.replace(/[^\d,]/g, ''))} placeholder="180,000" keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'} placeholderTextColor="#5E728C" />
            <Text style={styles.priceSuffix}>/ {priceLabel(priceBasis)}</Text>
          </View>
          <View style={styles.priceChips}>
            {[5000, 180000, 250000].map(p => (
              <TouchableOpacity key={p} style={[styles.chip, pricePerUnit === String(p) && styles.chipActive]} onPress={() => setPricePerUnit(String(p))} activeOpacity={0.85}>
                <Text style={[styles.chipText, pricePerUnit === String(p) && styles.chipTextActive]}>{formatRWF(p)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Total — explicit formula */}
        <GlassCard variant="luminous" padding="lg" style={{marginBottom: 12}}>
          <Text style={styles.totalLabel}>Agaciro kose</Text>
          <Text style={styles.totalValue}>{formatRWF(pricingResult.totalRWF)}</Text>
          <Text style={styles.totalFormula}>{pricingResult.formula}</Text>
          <View style={styles.totalHintRow}><View style={styles.totalHintDot} /><Text style={styles.totalHint}>{hasReference ? 'Calculated • Premium' : 'Estimated • Add reference for exact'}</Text></View>
        </GlassCard>

        {/* Confidence + review */}
        <GlassCard title="Confidence" subtitle={`${result.boards.length} bounding boxes • ${Math.round(confidence * 100)}%`} icon="◈" style={{marginBottom: 12}}>
          <View style={styles.confidenceBar}><View style={[styles.confidenceFill, {width: `${Math.round(confidence * 100)}%`, backgroundColor: confidence > 0.7 ? '#10B981' : confidence > 0.45 ? '#F59E0B' : '#EF4444'}]} /></View>
          {confidence < 0.85 && <Text style={styles.reviewHint}>Birasaba kugenzura — kosora umubare cyangwa ibipimo mbere yo kubika.</Text>}
        </GlassCard>

        <PremiumButton title="Bika muri Stock" onPress={saveToInventory} size="lg" loading={saving} />
        <PremiumButton title="Hindura" onPress={() => {}} variant="ghost" style={{marginTop: 8}} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}><Text style={styles.cancelText}>Subira inyuma</Text></TouchableOpacity>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 2, paddingBottom: 100},
  title: {fontSize: 18, fontWeight: '900', letterSpacing: 1.2, color: '#F1F6FF', textTransform: 'uppercase', marginTop: 8},
  subtitle: {fontSize: 11, color: '#8FA2BB', marginTop: 2, marginBottom: 12},
  imageCard: {height: 240, backgroundColor: '#0A1930', borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative'},
  image: {width: '100%', height: '100%'},
  boxesOverlay: {...StyleSheet.absoluteFill},
  bbox: {position: 'absolute', borderWidth: 1.5, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.12)', borderRadius: 6},
  imageScrim: {position: 'absolute', bottom: 0, left: 0, right: 0, height: 80},
  imageLabel: {position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: 'rgba(4,10,27,0.72)', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  imageLabelText: {color: '#F1F6FF', fontWeight: '700', fontSize: 12},
  imageLabelSub: {color: '#8FA2BB', fontSize: 11, marginTop: 2},
  warningBanner: {backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.20)', borderRadius: 14, padding: 12, marginBottom: 12, alignItems: 'center'},
  warningText: {color: '#FCD34D', fontSize: 12, fontWeight: '700', textAlign: 'center'},
  warningSub: {color: '#8FA2BB', fontSize: 11, marginTop: 4, textAlign: 'center'},
  warningBtn: {marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F59E0B'},
  warningBtnText: {color: '#fff', fontSize: 12, fontWeight: '800'},
  countContainer: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  countButton: {width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center'},
  countButtonPrimary: {width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)'},
  countButtonText: {fontSize: 22, color: '#EAF2FD', fontWeight: '700'},
  countCenter: {alignItems: 'center', marginHorizontal: 24, minWidth: 110},
  countNumber: {fontSize: 40, color: '#F1F6FF', fontWeight: '900', letterSpacing: -1},
  quickAdjust: {flexDirection: 'row', justifyContent: 'center', marginTop: 16},
  quickBtn: {paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)'},
  quickBtnGhost: {paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  quickText: {color: '#93C5FD', fontWeight: '700', fontSize: 12},
  quickTextGhost: {color: '#8FA2BB', fontSize: 11, fontWeight: '600'},
  lowConfidence: {color: '#FCD34D', fontSize: 12, textAlign: 'center', marginTop: 10, fontWeight: '600'},
  reviewHint: {color: '#8FA2BB', fontSize: 11, marginTop: 8, textAlign: 'center'},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap'},
  chip: {backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8, marginTop: 6},
  chipActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.22)'},
  chipText: {color: '#8FA2BB', fontSize: 12, fontWeight: '700'},
  chipTextActive: {color: '#93C5FD'},
  dimRow: {flexDirection: 'row', justifyContent: 'space-between'},
  dimField: {flex: 1, marginRight: 8},
  dimLabel: {fontSize: 10, color: '#8FA2BB', fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6},
  dimInput: {backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#F1F6FF', fontSize: 14, fontWeight: '700', textAlign: 'center'},
  referenceRow: {marginTop: 12},
  refChip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start'},
  refChipActive: {backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.18)'},
  refText: {fontSize: 12, color: '#8FA2BB', fontWeight: '600'},
  refTextActive: {color: '#6EE7B7'},
  refOptions: {flexDirection: 'row', marginTop: 8, flexWrap: 'wrap'},
  refMini: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginRight: 6, marginTop: 6},
  refMiniActive: {backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(96,165,250,0.18)'},
  refMiniText: {fontSize: 11, color: '#8FA2BB', fontWeight: '600'},
  refMiniTextActive: {color: '#93C5FD'},
  estimatedHint: {fontSize: 11, color: '#FCD34D', marginTop: 8, lineHeight: 14},
  calcBox: {marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)'},
  calcLabel: {fontSize: 11, color: '#EAF2FD', fontWeight: '600'},
  calcFormula: {fontSize: 10, color: '#8FA2BB', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'},
  priceBasisRow: {flexDirection: 'row', flexWrap: 'wrap'},
  basisChip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginRight: 8, marginTop: 6},
  basisChipActive: {backgroundColor: '#3B82F6', borderColor: '#60A5FA'},
  basisText: {fontSize: 12, color: '#8FA2BB', fontWeight: '700'},
  basisTextActive: {color: '#fff'},
  priceInputContainer: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 12, paddingHorizontal: 12},
  currencySymbol: {fontSize: 11, color: '#8FA2BB', marginRight: 6, fontWeight: '800'},
  priceInput: {flex: 1, fontSize: 18, color: '#F1F6FF', paddingVertical: 12, fontWeight: '800'},
  priceSuffix: {fontSize: 11, color: '#8FA2BB', fontWeight: '600'},
  priceChips: {flexDirection: 'row', marginTop: 10, flexWrap: 'wrap'},
  totalLabel: {fontSize: 10, color: '#8FA2BB', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700'},
  totalValue: {fontSize: 30, fontWeight: '900', color: '#93C5FD', textAlign: 'center', marginTop: 6, letterSpacing: -0.6},
  totalFormula: {fontSize: 11, color: '#8FA2BB', textAlign: 'center', marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'},
  totalHintRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10},
  totalHintDot: {width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981', marginRight: 6},
  totalHint: {fontSize: 11, color: '#8FA2BB', fontWeight: '500'},
  confidenceBar: {height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', marginTop: 8},
  confidenceFill: {height: '100%', borderRadius: 6},
  cancelLink: {alignItems: 'center', paddingVertical: 14, marginTop: 8},
  cancelText: {fontSize: 13, color: '#8FA2BB', fontWeight: '600'},
});
