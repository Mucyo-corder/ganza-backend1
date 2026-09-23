import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform} from 'react-native';
import {TextInput} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {formatRWF, calculateTotal} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {BoardDetectionResult} from '../../types';

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

  const adjustQuantity = (delta: number) => {
    setQuantity(q => Math.max(0, q + delta));
  };

  const saveToInventory = async () => {
    if (!numericPrice || numericPrice <= 0) {
      Alert.alert(t('error'), `${t('unitPrice')} – shyiramo igiciro nyacyo (>0)`);
      return;
    }
    if (quantity <= 0) {
      Alert.alert(t('error'), 'Umubare w\'imbaho ugomba kuba hejuru ya 0');
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
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: SPACING.xl}}>
      {/* Image + boxes */}
      <View style={styles.imageCard}>
        <Image source={{uri: imageUri}} style={styles.image} resizeMode="cover" />
        <View style={styles.boxesOverlay} pointerEvents="none">
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
        <View style={styles.imageLabel}>
          <Text style={styles.imageLabelText}>{t('boardsDetected', {count: quantity})} {isUserCorrected ? `⚠ ${t('userCorrected')}` : ''}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detectedBoards')}</Text>
        <Text style={styles.helper}>{t('adjustQuantity')} – {t('scanGuide')}</Text>
        <View style={styles.countContainer}>
          <TouchableOpacity style={styles.countButton} onPress={() => adjustQuantity(-1)} activeOpacity={0.8}>
            <Text style={styles.countButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.countCenter}>
            <Text style={styles.countNumber}>{quantity}</Text>
            <Text style={styles.countSub}>{isUserCorrected ? t('userCorrected') : `${Math.round(result.confidence * 100)}% confidence`}</Text>
          </View>
          <TouchableOpacity style={styles.countButton} onPress={() => adjustQuantity(1)} activeOpacity={0.8}>
            <Text style={styles.countButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
        {isUserCorrected && <Text style={styles.correctedLabel}>⚠ {t('userCorrected')} – {t('adjustQuantity')}</Text>}
        <View style={styles.quickAdjust}>
          {[1, 5, 10].map(n => (
            <TouchableOpacity key={n} style={styles.quickBtn} onPress={() => adjustQuantity(n)}>
              <Text style={styles.quickText}>+{n}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnDanger]} onPress={() => setQuantity(result.count)}>
            <Text style={styles.quickTextDanger}>{t('retakePhoto')} – reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('unitPrice')}</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencySymbol}>RWF</Text>
          <TextInput
            style={styles.priceInput}
            value={unitPrice}
            onChangeText={v => setUnitPrice(v.replace(/[^\d,]/g, ''))}
            placeholder="8,000"
            keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.priceChips}>
          {[5000, 8000, 10000, 15000].map(p => (
            <TouchableOpacity key={p} style={styles.chip} onPress={() => setUnitPrice(String(p))}>
              <Text style={styles.chipText}>{formatRWF(p)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.totalCard]}>
        <Text style={styles.totalLabel}>{t('totalValue')}</Text>
        <Text style={styles.calculation}>{quantity} × {formatRWF(numericPrice)} =</Text>
        <Text style={styles.totalValue}>{formatRWF(totalValue)}</Text>
      </View>

      {result.confidence > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidence</Text>
          <View style={styles.confidenceBar}>
            <View style={[styles.confidenceFill, {width: `${Math.round(result.confidence * 100)}%`, backgroundColor: result.confidence > 0.7 ? COLORS.success : result.confidence > 0.45 ? COLORS.warning : COLORS.error}]} />
          </View>
          <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}% • {result.boards.length} bounding boxes</Text>
          {result.confidence < 0.5 && result.count > 0 && <Text style={styles.lowConfidence}>{t('lowConfidence')}</Text>}
          {result.count === 0 && <Text style={styles.lowConfidence}>{t('noBoardsDetected')}</Text>}
        </View>
      )}

      <Button title={t('saveToInventory')} onPress={saveToInventory} variant="primary" size="lg" loading={saving} style={styles.saveButton} />
      <Button title={t('cancel')} onPress={() => navigation.goBack()} variant="outline" style={{marginTop: SPACING.sm}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  imageCard: {height: 260, backgroundColor: '#111', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border},
  image: {width: '100%', height: '100%'},
  boxesOverlay: {...StyleSheet.absoluteFill},
  bbox: {position: 'absolute', borderWidth: 2, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.18)', borderRadius: 4},
  imageLabel: {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: SPACING.sm},
  imageLabelText: {color: COLORS.cream, fontWeight: '700', textAlign: 'center', fontSize: FONT_SIZES.sm},
  section: {backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.border},
  sectionTitle: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700', marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.6},
  helper: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING.md},
  countContainer: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  countButton: {width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small},
  countButtonText: {fontSize: 28, color: COLORS.cream, fontWeight: '700'},
  countCenter: {alignItems: 'center', marginHorizontal: SPACING.xl, minWidth: 100},
  countNumber: {fontSize: 42, color: COLORS.cream, fontWeight: '800'},
  countSub: {fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2},
  correctedLabel: {color: COLORS.warning, fontSize: FONT_SIZES.sm, textAlign: 'center', marginTop: SPACING.sm, fontWeight: '600'},
  quickAdjust: {flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md, flexWrap: 'wrap'},
  quickBtn: {paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, marginHorizontal: 4, borderWidth: 1, borderColor: COLORS.border},
  quickBtnDanger: {backgroundColor: 'transparent'},
  quickText: {color: COLORS.gold, fontWeight: '700', fontSize: FONT_SIZES.sm},
  quickTextDanger: {color: COLORS.textSecondary, fontSize: FONT_SIZES.xs},
  priceInputContainer: {flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border},
  currencySymbol: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, paddingLeft: SPACING.md, marginRight: SPACING.sm, fontWeight: '700'},
  priceInput: {flex: 1, fontSize: FONT_SIZES.xl, color: COLORS.text, padding: SPACING.md, minHeight: 52},
  priceChips: {flexDirection: 'row', marginTop: SPACING.sm, flexWrap: 'wrap'},
  chip: {backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: SPACING.sm, marginTop: SPACING.xs},
  chipText: {color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600'},
  totalCard: {backgroundColor: COLORS.primary, alignItems: 'center', borderWidth: 0},
  totalLabel: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.6},
  calculation: {fontSize: FONT_SIZES.md, color: COLORS.textSecondary},
  totalValue: {fontSize: 36, fontWeight: '900', color: COLORS.gold, marginTop: 4},
  confidenceBar: {height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden', marginTop: SPACING.sm},
  confidenceFill: {height: '100%', borderRadius: 4},
  confidenceText: {color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm, textAlign: 'center'},
  lowConfidence: {color: COLORS.warning, fontSize: FONT_SIZES.sm, textAlign: 'center', marginTop: SPACING.sm},
  saveButton: {marginTop: SPACING.md},
});
