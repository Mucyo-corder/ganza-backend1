import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {InventoryItem} from '../../types';

export default function ItemDetailScreen({route, navigation}: any) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const item = route.params?.item || {};
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '');
  const [unitPrice, setUnitPrice] = useState(item.unitPrice?.toString() || '');
  const [saving, setSaving] = useState(false);

  const totalValue = Math.round(parseInt(quantity || '0') * parseFloat(unitPrice || '0'));

  const saveItem = async () => {
    setSaving(true);
    try {
      const updatedItem = {
        ...item,
        quantity: parseInt(quantity || '0'),
        unitPrice: Math.round(parseFloat(unitPrice || '0')),
        totalValue,
        updatedAt: Date.now(),
      };
      await firebaseService.saveInventoryItem(updatedItem);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('error') + ': ' + e.message);
    }
    setSaving(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{item.id ? t('editStock') : t('addStock')}</Text>
      <View style={styles.form}>
        <Text style={styles.label}>{t('quantity')}</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <Text style={styles.label}>{t('unitPrice')}</Text>
        <TextInput style={styles.input} value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" />
        <Text style={[styles.label, styles.totalLabel]}>{t('totalValue')}</Text>
        <Text style={styles.totalValue}>{formatRWF(totalValue)}</Text>
        <Button title={t('save')} onPress={saveItem} variant="primary" size="lg" loading={saving} style={styles.saveButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  title: {fontSize: FONT_SIZES.xl, color: COLORS.cream, fontWeight: '700', marginBottom: SPACING.lg},
  form: {backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.small},
  label: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '600'},
  input: {backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONT_SIZES.md, marginBottom: SPACING.md},
  totalLabel: {marginTop: SPACING.md},
  totalValue: {fontSize: FONT_SIZES.xxl, color: COLORS.gold, fontWeight: '800'},
  saveButton: {marginTop: SPACING.lg},
});
