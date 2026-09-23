import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF, calculateTotal} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';
import {SaleItem, InventoryItem} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';

export default function SalesScreen({navigation}: {navigation: {navigate: (s: string, p?: unknown) => void}}) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank'>('cash');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const businessId = user?.businessId || user?.uid || 'default-business';
    try {
      const [salesData, invData] = await Promise.all([
        firebaseService.getSales(businessId).catch(() => []),
        firebaseService.getInventory(businessId).catch(() => []),
      ]);
      setSales(salesData);
      setInventory(invData);
    } catch (e) {
      console.error('Failed to load sales:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const selectedInventoryItem = inventory.find(i => i.id === selectedItem);
  const qtyNum = parseInt(quantity || '0', 10) || 0;
  const totalValue = calculateTotal(qtyNum, selectedInventoryItem?.unitPrice || 0);
  const canSubmit = selectedItem && qtyNum > 0 && customerName.trim() && selectedInventoryItem && qtyNum <= selectedInventoryItem.quantity;

  const processSale = async () => {
    if (!selectedItem || !quantity || !customerName.trim()) {
      Alert.alert(t('error'), 'Uzuza ibisabwa byose');
      return;
    }
    if (!selectedInventoryItem) {
      Alert.alert(t('error'), 'Hitamo igicuruzwa');
      return;
    }
    const qty = qtyNum;
    if (qty <= 0) {
      Alert.alert(t('error'), 'Umubare ugomba kuba hejuru ya 0');
      return;
    }
    if (qty > selectedInventoryItem.quantity) {
      Alert.alert(t('error'), `Stock ihari: ${selectedInventoryItem.quantity} – ntiwahagurisha birenze`);
      return;
    }
    Alert.alert(
      t('saleTotal'),
      `${selectedInventoryItem.name}\n${qty} × ${formatRWF(selectedInventoryItem.unitPrice)} = ${formatRWF(totalValue)}\n\n${t('customer')}: ${customerName}\nEmeza igurisha?`,
      [
        {text: t('cancel'), style: 'cancel'},
        {
          text: t('confirm'),
          onPress: async () => {
            setSubmitting(true);
            try {
              const businessId = user?.businessId || user?.uid || 'default-business';
              const sale: SaleItem = {
                id: `sale-${Date.now()}`,
                businessId,
                inventoryItemId: selectedItem,
                itemName: selectedInventoryItem.name,
                quantity: qty,
                unitPrice: selectedInventoryItem.unitPrice,
                totalValue,
                customerId: `cust-${Date.now()}`,
                customerName: customerName.trim(),
                paymentAmount: totalValue,
                paymentMethod,
                status: 'confirmed',
                createdAt: Date.now(),
              };
              await firebaseService.saveSale(sale);
              const remaining = selectedInventoryItem.quantity - qty;
              const factor = selectedInventoryItem.quantity > 0 ? remaining / selectedInventoryItem.quantity : 0;
              const updatedItem: any = {
                ...selectedInventoryItem,
                quantity: remaining,
                totalValue: remaining * selectedInventoryItem.unitPrice,
                volumeM3: (selectedInventoryItem as any).volumeM3 ? (selectedInventoryItem as any).volumeM3 * factor : undefined,
                areaM2: (selectedInventoryItem as any).areaM2 ? (selectedInventoryItem as any).areaM2 * factor : undefined,
                totalLengthM: (selectedInventoryItem as any).totalLengthM ? (selectedInventoryItem as any).totalLengthM * factor : undefined,
                updatedAt: Date.now(),
              };
              await firebaseService.saveInventoryItem(updatedItem);
              Alert.alert(t('saleConfirmed'), `${formatRWF(totalValue)} – ${t('saleConfirmed')}`);
              setSelectedItem('');
              setQuantity('');
              setCustomerName('');
              setCustomerPhone('');
              loadData();
            } catch (e) {
              const msg = e instanceof Error ? e.message : t('backendError');
              Alert.alert(t('error'), msg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <AmbientBackground>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
        <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
        <Text style={styles.title}>{t('sales')}</Text>
        <Text style={styles.subtitle}>Gurisha • Hitamo stock • Kugabanya ingano • Kuvugurura agaciro</Text>

        <GlassCard title="Hitamo igicuruzwa" subtitle="Ibihari muri stock" icon="⬡">
          {inventory.filter(i => i.quantity > 0).length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>⬢</Text></View>
              <Text style={styles.empty}>{t('noResult')} – nta stock ihari</Text>
            </View>
          ) : (
            <FlatList
              data={inventory.filter(i => i.quantity > 0)}
              scrollEnabled={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.itemRow, selectedItem === item.id && styles.selectedItem]}
                  onPress={() => setSelectedItem(item.id)}
                  activeOpacity={0.88}
                >
                  {selectedItem === item.id && <LinearGradient colors={['rgba(59,130,246,0.08)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={StyleSheet.absoluteFill} />}
                  <View style={styles.itemLeft}>
                    <View style={[styles.itemIconBox, selectedItem === item.id && styles.itemIconActive]}><Text style={styles.itemIcon}>⬢</Text></View>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemStock}>{item.quantity} imbaho • {formatRWF(item.unitPrice)}/pc</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemTotal}>{formatRWF(item.quantity * item.unitPrice)}</Text>
                    {selectedItem === item.id && <View style={styles.selectedDot} />}
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          )}

          <Text style={styles.sectionTitle}>{t('customer')}</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>◈</Text>
            <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder={t('fullName')} placeholderTextColor="#5E728C" />
          </View>
          <View style={[styles.inputWrap, {marginTop: 8}]}>
            <Text style={styles.inputIcon}>⬡</Text>
            <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} placeholder={t('phone')} placeholderTextColor="#5E728C" keyboardType="phone-pad" />
          </View>

          <Text style={styles.sectionTitle}>Umubare</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(String(Math.max(0, qtyNum - 1)))} activeOpacity={0.85}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.qtyInputWrap}>
              <TextInput style={styles.qtyInput} value={quantity} onChangeText={setQuantity} keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'} placeholder="0" placeholderTextColor="#5E728C" />
              <Text style={styles.qtySub}>{selectedInventoryItem ? `${selectedInventoryItem.quantity} available` : 'Hitamo}</Text>
            </View>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPrimary]} onPress={() => setQuantity(String(qtyNum + 1))} activeOpacity={0.85}>
              <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={StyleSheet.absoluteFill} />
              <Text style={[styles.qtyBtnText, {color: '#fff'}]}>＋</Text>
            </TouchableOpacity>
          </View>
          {selectedInventoryItem && qtyNum > selectedInventoryItem.quantity && <Text style={styles.errorText}>Stock ihari: {selectedInventoryItem.quantity}</Text>}

          <Text style={styles.sectionTitle}>Ubwishyu</Text>
          <View style={styles.payRow}>
            {(['cash', 'momo', 'bank'] as const).map(m => (
              <TouchableOpacity key={m} style={[styles.payChip, paymentMethod === m && styles.payChipActive]} onPress={() => setPaymentMethod(m)} activeOpacity={0.85}>
                {paymentMethod === m && <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={StyleSheet.absoluteFill} />}
                <Text style={[styles.payText, paymentMethod === m && styles.payTextActive]}>{m === 'cash' ? 'Cash' : m === 'momo' ? 'MoMo' : 'Bank'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedInventoryItem ? (
            <View style={styles.summary}>
              <LinearGradient colors={['rgba(59,130,246,0.10)', 'rgba(255,255,255,0.03)'] as unknown as string[]} style={StyleSheet.absoluteFill} />
              <View>
                <Text style={styles.summaryLabel}>{qtyNum} × {formatRWF(selectedInventoryItem.unitPrice)}</Text>
                <Text style={styles.summaryHint}>Calculated • {qtyNum} × price</Text>
              </View>
              <Text style={styles.summaryTotal}>{formatRWF(totalValue)}</Text>
            </View>
          ) : null}

          <PremiumButton title={t('submit')} onPress={processSale} loading={submitting} disabled={!canSubmit} style={styles.submitButton} size="lg" />
          {!canSubmit && <Text style={styles.hint}>Uzuza: igicuruzwa, umubare (&gt;0, ≤ stock), izina ry'umukiriya</Text>}
        </GlassCard>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('recentTransactions')}</Text>
          <StatusPill status="idle" label={`${sales.length} sales`} />
        </View>
        {loading ? (
          <Text style={styles.empty}>{t('loading')}</Text>
        ) : sales.length === 0 ? (
          <GlassCard padding="lg">
            <Text style={styles.empty}>Nta gurisha riraba</Text>
          </GlassCard>
        ) : (
          sales
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20)
            .map(sale => (
              <TouchableOpacity key={sale.id} style={styles.saleItem} onPress={() => navigation.navigate('SaleDetail', {sale})} activeOpacity={0.85}>
                <View style={styles.saleIconBox}><Text style={styles.saleIcon}>◆</Text></View>
                <View style={{flex: 1}}>
                  <Text style={styles.saleName}>{sale.itemName}</Text>
                  <Text style={styles.saleMeta}>{sale.customerName} • {sale.quantity} imbaho • {new Date(sale.createdAt).toLocaleDateString('rw-RW')}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.saleAmount}>{formatRWF(sale.totalValue)}</Text>
                  <View style={[styles.saleStatusPill, sale.status === 'confirmed' && styles.saleStatusConfirmed]}><Text style={[styles.saleStatusText, sale.status === 'confirmed' && styles.saleStatusTextConfirmed]}>{sale.status}</Text></View>
                </View>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14},
  sectionTitle: {fontSize: 10, color: '#8FA2BB', fontWeight: '700', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.7},
  empty: {color: '#8FA2BB', textAlign: 'center', padding: 12, fontSize: 12},
  emptyBox: {alignItems: 'center', paddingVertical: 16},
  emptyIconBox: {width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 8},
  emptyIcon: {fontSize: 16, color: '#6B84A0'},
  itemRow: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative',
  },
  selectedItem: {borderColor: 'rgba(96,165,250,0.22)', backgroundColor: 'rgba(59,130,246,0.08)'},
  itemLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  itemIconBox: {width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  itemIconActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.18)'},
  itemIcon: {fontSize: 12, color: '#CBD8E6'},
  itemName: {color: '#F1F6FF', fontSize: 13, fontWeight: '700'},
  itemStock: {color: '#8FA2BB', fontSize: 11, marginTop: 2},
  itemRight: {alignItems: 'flex-end', flexDirection: 'row'},
  itemTotal: {color: '#93C5FD', fontWeight: '800', fontSize: 12, marginRight: 8},
  selectedDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#60A5FA'},
  inputWrap: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 12},
  inputIcon: {fontSize: 12, color: '#6B84A0', marginRight: 8},
  input: {flex: 1, paddingVertical: 12, color: '#F1F6FF', fontSize: 14, fontWeight: '500'},
  qtyRow: {flexDirection: 'row', alignItems: 'center'},
  qtyBtn: {width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  qtyBtnPrimary: {borderColor: 'rgba(255,255,255,0.14)'},
  qtyBtnText: {fontSize: 18, color: '#EAF2FD', fontWeight: '700'},
  qtyInputWrap: {flex: 1, marginHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center'},
  qtyInput: {color: '#F1F6FF', fontSize: 18, textAlign: 'center', fontWeight: '800', paddingVertical: 2, minWidth: 40},
  qtySub: {fontSize: 10, color: '#6B84A0', marginTop: 2},
  errorText: {color: '#FCA5A5', fontSize: 11, marginTop: 6},
  payRow: {flexDirection: 'row'},
  payChip: {paddingHorizontal: 16, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative'},
  payChipActive: {borderColor: 'rgba(96,165,250,0.22)'},
  payText: {color: '#8FA2BB', fontWeight: '700', fontSize: 12},
  payTextActive: {color: '#fff'},
  summary: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(96,165,250,0.14)', overflow: 'hidden', position: 'relative'},
  summaryLabel: {color: '#8FA2BB', fontSize: 12},
  summaryHint: {color: '#6B84A0', fontSize: 10, marginTop: 2},
  summaryTotal: {color: '#60A5FA', fontSize: 18, fontWeight: '900'},
  submitButton: {marginTop: 16},
  hint: {color: '#5E728C', fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 14},
  historyHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10},
  historyTitle: {fontSize: 12, color: '#EAF2FD', fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase'},
  saleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  saleIconBox: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.16)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  saleIcon: {fontSize: 12, color: '#93C5FD'},
  saleName: {color: '#F1F6FF', fontWeight: '700', fontSize: 13},
  saleMeta: {color: '#8FA2BB', fontSize: 11, marginTop: 2},
  saleAmount: {color: '#93C5FD', fontWeight: '800', fontSize: 12},
  saleStatusPill: {marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'},
  saleStatusConfirmed: {backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.18)'},
  saleStatusText: {fontSize: 9, color: '#8FA2BB', textTransform: 'capitalize', fontWeight: '700'},
  saleStatusTextConfirmed: {color: '#6EE7B7'},
});
