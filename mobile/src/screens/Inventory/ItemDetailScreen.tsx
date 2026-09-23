import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, Alert} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {SPACING} from '../../constants/theme';
import {InventoryItem} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';

export default function ItemDetailScreen({route, navigation}: any) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const item = route.params?.item || {};
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '');
  const [unitPrice, setUnitPrice] = useState(item.unitPrice?.toString() || '');
  const [name, setName] = useState(item.name || 'Imbaho');
  const [saving, setSaving] = useState(false);
  const totalValue = Math.round(parseInt(quantity || '0') * parseFloat(unitPrice || '0'));

  const saveItem = async () => {
    if (!name.trim()) {Alert.alert(t('error'), 'Izina rikenewe'); return;}
    if (parseInt(quantity||'0') <=0) {Alert.alert(t('error'), 'Umubare ugomba kuba >0'); return;}
    setSaving(true);
    try {
      const updatedItem = {...item, id: item.id || `inv-${Date.now()}`, businessId: user?.businessId || user?.uid || 'default-business', name: name.trim(), quantity: parseInt(quantity || '0'), unitPrice: Math.round(parseFloat(unitPrice || '0')), totalValue, updatedAt: Date.now(), createdAt: item.createdAt || Date.now()};
      await firebaseService.saveInventoryItem(updatedItem);
      navigation.goBack();
    } catch (e: any) {Alert.alert(t('error') + ': ' + e.message);}
    setSaving(false);
  };

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" />
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{item.id ? t('editStock') : t('addStock')}</Text>
        <Text style={styles.subtitle}>Hindura ububiko • GANZA AI irakurikirana</Text>
        <GlassCard title={item.id ? 'Hindura' : 'Shyiramo'} subtitle={item.name || 'New item'} icon="⬢">
          <Text style={styles.label}>Izina</Text>
          <View style={styles.inputWrap}><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Izina ry'igicuruzwa" placeholderTextColor="#5E728C" /></View>
          <Text style={styles.label}>Umubare</Text>
          <View style={styles.inputWrap}><TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" placeholderTextColor="#5E728C" /></View>
          <Text style={styles.label}>{t('unitPrice')}</Text>
          <View style={styles.inputWrap}><Text style={styles.currency}>RWF</Text><TextInput style={styles.input} value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" placeholder="8000" placeholderTextColor="#5E728C" /></View>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t('totalValue')}</Text>
            <Text style={styles.totalValue}>{formatRWF(totalValue)}</Text>
          </View>
          <PremiumButton title={t('save')} onPress={saveItem} size="lg" loading={saving} style={styles.saveButton} icon="✓" />
        </GlassCard>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
  title: {fontSize: 22, color: '#F1F6FF', fontWeight: '900', letterSpacing: -0.4},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14},
  label: {fontSize: 10, color: '#8FA2BB', marginBottom: 6, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 12},
  inputWrap: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 12},
  input: {flex: 1, paddingVertical: 12, color: '#F1F6FF', fontSize: 14, fontWeight: '500'},
  currency: {fontSize: 11, color: '#8FA2BB', fontWeight: '800', marginRight: 8},
  totalCard: {marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.14)', alignItems: 'center'},
  totalLabel: {fontSize: 10, color: '#8FA2BB', letterSpacing: 0.7, textTransform: 'uppercase', fontWeight: '700'},
  totalValue: {fontSize: 24, color: '#60A5FA', fontWeight: '900', marginTop: 6},
  saveButton: {marginTop: 16},
});
