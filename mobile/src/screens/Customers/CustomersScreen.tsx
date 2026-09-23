import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {Customer} from '../../types';

export default function CustomersScreen({navigation}: any) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!user?.businessId) return;
    try {
      const data = await firebaseService.getCustomers(user.businessId);
      setCustomers(data);
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
    setLoading(false);
  };

  const addCustomer = async () => {
    if (!name || !phone) {
      Alert.alert(t('error') + ': Name and phone required');
      return;
    }
    try {
      const customer = {
        id: `cust-${Date.now()}`,
        businessId: user!.businessId!,
        name,
        phone,
        createdAt: Date.now(),
      };
      await firebaseService.saveCustomer(customer);
      setName('');
      setPhone('');
      loadCustomers();
    } catch (e: any) {
      Alert.alert(t('error') + ': ' + e.message);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    Alert.alert(t('error'), 'Delete this customer?', [
      {text: t('cancel'), style: 'cancel'},
      {text: t('remove'), style: 'destructive', onPress: async () => {
        await firebaseService.deleteInventoryItem(customerId);
        loadCustomers();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('customers')}</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('fullName')} placeholderTextColor={COLORS.textMuted} />
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('phone')} placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />
        <Button title={t('addCustomer')} onPress={addCustomer} variant="primary" style={styles.addButton} />
      </View>
      {loading ? (
        <Text style={styles.loading}>{t('loading')}</Text>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={c => c.id}
          renderItem={({item}) => (
            <View style={styles.customerCard}>
              <View>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerPhone}>{item.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteCustomer(item.id)}>
                <Text style={styles.deleteBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  title: {fontSize: FONT_SIZES.xl, color: COLORS.cream, fontWeight: '700', marginBottom: SPACING.lg},
  form: {backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.small, marginBottom: SPACING.lg},
  input: {backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONT_SIZES.md, marginBottom: SPACING.sm},
  addButton: {marginTop: SPACING.sm},
  customerCard: {flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, ...SHADOWS.small},
  customerName: {color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: '600'},
  customerPhone: {color: COLORS.textSecondary, fontSize: FONT_SIZES.sm},
  deleteBtn: {fontSize: 18},
  loading: {color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl},
});
