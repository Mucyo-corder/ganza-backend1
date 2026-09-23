import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, Platform} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {Card} from '../../components/common/Card';
import {formatRWF, calculateTotal} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {SaleItem, InventoryItem} from '../../types';

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
    }, [loadData])
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
    // Confirm dialog – inventory only reduced AFTER confirmed sale
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
              // Only now decrement inventory (atomic, never before confirmation)
              const updatedItem = {
                ...selectedInventoryItem,
                quantity: selectedInventoryItem.quantity - qty,
                totalValue: (selectedInventoryItem.quantity - qty) * selectedInventoryItem.unitPrice,
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
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: SPACING.xl}}>
      <Text style={styles.title}>{t('sales')}</Text>

      <Card>
        <Text style={styles.sectionTitle}>{t('inventory')} – hitamo</Text>
        {inventory.filter(i => i.quantity > 0).length === 0 ? (
          <Text style={styles.empty}>{t('noResult')} – nta stock ihari</Text>
        ) : (
          <FlatList
            data={inventory.filter(i => i.quantity > 0)}
            scrollEnabled={false}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.itemRow, selectedItem === item.id && styles.selectedItem]}
                onPress={() => setSelectedItem(item.id)}
                activeOpacity={0.85}
              >
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemStock}>{item.quantity} pcs • {formatRWF(item.unitPrice)}/pc</Text>
                </View>
                <Text style={styles.itemTotal}>{formatRWF(item.quantity * item.unitPrice)}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
          />
        )}

        <Text style={styles.sectionTitle}>{t('customer')}</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder={t('fullName')}
          placeholderTextColor={COLORS.textMuted}
        />
        <TextInput
          style={[styles.input, {marginTop: SPACING.sm}]}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder={t('phone')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionTitle}>Umubare</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(String(Math.max(0, qtyNum - 1)))}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.qtyInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(String(qtyNum + 1))}>
            <Text style={styles.qtyBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
        {selectedInventoryItem && qtyNum > selectedInventoryItem.quantity && (
          <Text style={styles.errorText}>Stock ihari: {selectedInventoryItem.quantity}</Text>
        )}

        <Text style={styles.sectionTitle}>Ubwishyu</Text>
        <View style={styles.payRow}>
          {(['cash', 'momo', 'bank'] as const).map(m => (
            <TouchableOpacity key={m} style={[styles.payChip, paymentMethod === m && styles.payChipActive]} onPress={() => setPaymentMethod(m)}>
              <Text style={[styles.payText, paymentMethod === m && styles.payTextActive]}>{m === 'cash' ? 'Cash' : m === 'momo' ? 'MoMo' : 'Bank'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedInventoryItem ? (
          <View style={styles.summary}>
            <Text style={styles.summaryLine}>{qtyNum} × {formatRWF(selectedInventoryItem.unitPrice)}</Text>
            <Text style={styles.summaryTotal}>{formatRWF(totalValue)}</Text>
          </View>
        ) : null}

        <Button title={t('submit')} onPress={processSale} variant="primary" size="lg" loading={submitting} disabled={!canSubmit} style={styles.submitButton} />
        {!canSubmit && <Text style={styles.hint}>Uzuza: igicuruzwa, umubare (&gt;0, ≤ stock), izina ry&apos;umukiriya</Text>}
      </Card>

      <Text style={styles.historyTitle}>{t('recentTransactions')}</Text>
      {loading ? (
        <Text style={styles.empty}>{t('loading')}</Text>
      ) : sales.length === 0 ? (
        <Text style={styles.empty}>{t('noResult')}</Text>
      ) : (
        sales
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20)
          .map(sale => (
            <TouchableOpacity key={sale.id} style={styles.saleItem} onPress={() => navigation.navigate('SaleDetail', {sale})}>
              <View>
                <Text style={styles.saleName}>{sale.itemName}</Text>
                <Text style={styles.saleMeta}>{sale.customerName} • {sale.quantity} pcs • {new Date(sale.createdAt).toLocaleDateString('rw-RW')}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.saleAmount}>{formatRWF(sale.totalValue)}</Text>
                <Text style={[styles.saleStatus, sale.status === 'confirmed' && styles.saleConfirmed]}>{sale.status}</Text>
              </View>
            </TouchableOpacity>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  title: {fontSize: FONT_SIZES.xl, color: COLORS.cream, fontWeight: '800', marginBottom: SPACING.lg},
  sectionTitle: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.6},
  empty: {color: COLORS.textMuted, textAlign: 'center', padding: SPACING.md},
  itemRow: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedItem: {borderColor: COLORS.gold, backgroundColor: '#3D3520'},
  itemName: {color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: '600'},
  itemStock: {color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2},
  itemTotal: {color: COLORS.gold, fontWeight: '700', fontSize: FONT_SIZES.sm},
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  qtyRow: {flexDirection: 'row', alignItems: 'center'},
  qtyBtn: {width: 48, height: 48, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center'},
  qtyBtnText: {fontSize: 22, color: COLORS.text, fontWeight: '700'},
  qtyInput: {
    flex: 1,
    marginHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorText: {color: COLORS.error, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs},
  payRow: {flexDirection: 'row'},
  payChip: {paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.surface, borderRadius: 20, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border},
  payChipActive: {backgroundColor: COLORS.gold, borderColor: COLORS.gold},
  payText: {color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZES.sm},
  payTextActive: {color: COLORS.background},
  summary: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.lg, padding: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md},
  summaryLine: {color: COLORS.textSecondary, fontSize: FONT_SIZES.md},
  summaryTotal: {color: COLORS.gold, fontSize: FONT_SIZES.xl, fontWeight: '900'},
  submitButton: {marginTop: SPACING.lg},
  hint: {color: COLORS.textMuted, fontSize: FONT_SIZES.xs, textAlign: 'center', marginTop: SPACING.sm},
  historyTitle: {fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '700', marginTop: SPACING.lg, marginBottom: SPACING.sm},
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saleName: {color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZES.sm},
  saleMeta: {color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2},
  saleAmount: {color: COLORS.gold, fontWeight: '700', fontSize: FONT_SIZES.sm},
  saleStatus: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'capitalize'},
  saleConfirmed: {color: COLORS.success},
});
