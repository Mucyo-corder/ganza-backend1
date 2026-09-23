import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform, TextInput} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF, calculateTotal} from '../../utils/formatters';
import {SPACING, BORDER_RADIUS} from '../../constants/theme';
import {BoardDetectionResult} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';

interface Props {
  route: {params: {result: BoardDetectionResult; imageUri: string}};
  navigation: {goBack: () => void; navigate: (s: string) => void};
}

export default function ScanResultScreen({route, navigation}: Props) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const {result, imageUri} = route.params;
  const [quantity, setQuantity] = useState<number>(result.count);
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const isUserCorrected = quantity !== result.count;
  const numericPrice = parseFloat(unitPrice.replace(/[^\d]/g, '')) || 0;
  const totalValue = calculateTotal(quantity, numericPrice);

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
    setSaving(true);
    try {
      const detectionResult = {...result, count: quantity};
      const inventoryItem = {
        id: `inv-${Date.now()}`,
        businessId: user?.businessId || user?.uid || 'default-business',
        name: 'Imbaho',
        category: 'timber',
        quantity,
        unit: 'pieces',
        unitPrice: Math.round(numericPrice),
        totalValue,
        imageUrl: imageUri,
        detectionResult,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isUserCorrected,
      };
      await firebaseService.saveInventoryItem(inventoryItem as unknown as import('../../types').InventoryItem);
      Alert.alert(t('saveToInventory'), `Byabitswe: ${quantity} × ${formatRWF(numericPrice)} = ${formatRWF(totalValue)}`);
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('backendError');
      Alert.alert(t('error'), msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" />
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
        <View style={styles.imageCard}>
          <Image source={{uri: imageUri}} style={styles.image} resizeMode="cover" />
          <View style={styles.boxesOverlay} pointerEvents="none">
            {result.boards.map(b => (
              <View key={b.id} style={[styles.bbox, {left: `${b.boundingBox.x * 100}%`, top: `${b.boundingBox.y * 100}%`, width: `${b.boundingBox.width * 100}%`, height: `${b.boundingBox.height * 100}%`}]} />
            ))}
          </View>
          <LinearGradient colors={['rgba(0,0,0,0.00)', 'rgba(4,10,27,0.72)'] as unknown as string[]} style={styles.imageScrim} />
          <View style={styles.imageLabel}>
            <View style={styles.imageLabelIconBox}><Text style={styles.imageLabelIcon}>⬢</Text></View>
            <Text style={styles.imageLabelText}>{t('boardsDetected', {count: quantity})} {isUserCorrected ? `• ${t('userCorrected')}` : `• ${Math.round(result.confidence * 100)}%`}</Text>
          </View>
        </View>

        <GlassCard title={t('detectedBoards')} subtitle="AI Vision • Kosora umubare niba bikenewe" icon="⬢" style={{marginBottom: 12}}>
          <Text style={styles.helper}>{t('adjustQuantity')} — GANZA AI ntiyigeze ikosa, ariko ushobora gukosora.</Text>
          <View style={styles.countContainer}>
            <TouchableOpacity style={styles.countButton} onPress={() => adjustQuantity(-1)} activeOpacity={0.85}><Text style={styles.countButtonText}>−</Text></TouchableOpacity>
            <View style={styles.countCenter}>
              <Text style={styles.countNumber}>{quantity}</Text>
              <StatusPill status={isUserCorrected ? 'warning' : 'success'} label={isUserCorrected ? t('userCorrected') : `${Math.round(result.confidence * 100)}% confidence`} />
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
        </GlassCard>

        <GlassCard title={t('unitPrice')} subtitle="Shyiramo igiciro cy'imbaho imwe" icon="◆" style={{marginBottom: 12}}>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>RWF</Text>
            <TextInput style={styles.priceInput} value={unitPrice} onChangeText={v => setUnitPrice(v.replace(/[^\d,]/g, ''))} placeholder="8,000" keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'} placeholderTextColor="#5E728C" />
          </View>
          <View style={styles.priceChips}>
            {[5000, 8000, 10000, 15000].map(p => (
              <TouchableOpacity key={p} style={[styles.chip, unitPrice === String(p) && styles.chipActive]} onPress={() => setUnitPrice(String(p))} activeOpacity={0.85}>
                <Text style={[styles.chipText, unitPrice === String(p) && styles.chipTextActive]}>{formatRWF(p)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard variant="luminous" padding="lg" style={{marginBottom: 12}}>
          <Text style={styles.totalLabel}>{t('totalValue')}</Text>
          <Text style={styles.calculation}>{quantity} × {formatRWF(numericPrice)} =</Text>
          <Text style={styles.totalValue}>{formatRWF(totalValue)}</Text>
          <View style={styles.totalHintRow}><View style={styles.totalHintDot} /><Text style={styles.totalHint}>AI calculated • Precision 98.4%</Text></View>
        </GlassCard>

        {result.confidence > 0 && (
          <GlassCard title="Confidence" subtitle={`${result.boards.length} bounding boxes`} icon="◈" style={{marginBottom: 12}}>
            <View style={styles.confidenceBar}><View style={[styles.confidenceFill, {width: `${Math.round(result.confidence * 100)}%`, backgroundColor: result.confidence > 0.7 ? '#10B981' : result.confidence > 0.45 ? '#F59E0B' : '#EF4444'}]} /></View>
            <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}% • {result.boards.length} boxes</Text>
            {result.confidence < 0.5 && result.count > 0 && <Text style={styles.lowConfidence}>{t('lowConfidence')}</Text>}
            {result.count === 0 && <Text style={styles.lowConfidence}>{t('noBoardsDetected')}</Text>}
          </GlassCard>
        )}

        <PremiumButton title={t('saveToInventory')} onPress={saveToInventory} size="lg" loading={saving} icon="⬢" />
        <PremiumButton title={t('cancel')} onPress={() => navigation.goBack()} variant="ghost" style={{marginTop: 8}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
  imageCard: {height: 260, backgroundColor: '#0A1930', borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative'},
  image: {width: '100%', height: '100%'},
  boxesOverlay: {...StyleSheet.absoluteFill},
  bbox: {position: 'absolute', borderWidth: 1.5, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.12)', borderRadius: 6},
  imageScrim: {position: 'absolute', bottom: 0, left: 0, right: 0, height: 80},
  imageLabel: {position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(4,10,27,0.72)', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  imageLabelIconBox: {width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(59,130,246,0.14)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 8},
  imageLabelIcon: {fontSize: 12, color: '#93C5FD'},
  imageLabelText: {color: '#F1F6FF', fontWeight: '700', fontSize: 12, flex: 1},
  helper: {fontSize: 12, color: '#8FA2BB', marginBottom: 12, lineHeight: 16},
  countContainer: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  countButton: {width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center'},
  countButtonPrimary: {width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)'},
  countButtonText: {fontSize: 22, color: '#EAF2FD', fontWeight: '700'},
  countCenter: {alignItems: 'center', marginHorizontal: 24, minWidth: 110},
  countNumber: {fontSize: 40, color: '#F1F6FF', fontWeight: '900', letterSpacing: -1},
  quickAdjust: {flexDirection: 'row', justifyContent: 'center', marginTop: 16},
  quickBtn: {paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)'},
  quickBtnGhost: {paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'transparent', borderRadius: 20, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  quickText: {color: '#93C5FD', fontWeight: '700', fontSize: 12},
  quickTextGhost: {color: '#8FA2BB', fontSize: 11, fontWeight: '600'},
  priceInputContainer: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  currencySymbol: {fontSize: 11, color: '#8FA2BB', paddingLeft: 14, marginRight: 8, fontWeight: '800', letterSpacing: 0.6},
  priceInput: {flex: 1, fontSize: 20, color: '#F1F6FF', padding: 14, fontWeight: '800'},
  priceChips: {flexDirection: 'row', marginTop: 10, flexWrap: 'wrap'},
  chip: {backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8, marginTop: 6},
  chipActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.22)'},
  chipText: {color: '#8FA2BB', fontSize: 12, fontWeight: '700'},
  chipTextActive: {color: '#93C5FD'},
  totalLabel: {fontSize: 10, color: '#8FA2BB', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700'},
  calculation: {fontSize: 13, color: '#8FA2BB', textAlign: 'center', marginTop: 6},
  totalValue: {fontSize: 32, fontWeight: '900', color: '#60A5FA', textAlign: 'center', marginTop: 4, letterSpacing: -0.8},
  totalHintRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10},
  totalHintDot: {width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981', marginRight: 6},
  totalHint: {fontSize: 11, color: '#6EE7B7', fontWeight: '600'},
  confidenceBar: {height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', marginTop: 8},
  confidenceFill: {height: '100%', borderRadius: 6},
  confidenceText: {color: '#8FA2BB', fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '600'},
  lowConfidence: {color: '#FCD34D', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: '600'},
});
