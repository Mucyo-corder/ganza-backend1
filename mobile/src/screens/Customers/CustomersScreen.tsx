import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {SPACING} from '../../constants/theme';
import {Customer} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';

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
      const customer = {id: `cust-${Date.now()}`, businessId: user!.businessId!, name, phone, createdAt: Date.now()};
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
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('customers')}</Text>
        <Text style={styles.subtitle}>Abakiriya • GANZA CRM • AI-tracked</Text>

        <GlassCard title="Ongera umukiriya" subtitle="Shyira amazina na telephone" icon="◈" style={{marginBottom: 14}}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>◈</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('fullName')} placeholderTextColor="#5E728C" />
          </View>
          <View style={[styles.inputWrap, {marginTop: 8}]}>
            <Text style={styles.inputIcon}>⬡</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('phone')} placeholderTextColor="#5E728C" keyboardType="phone-pad" />
          </View>
          <PremiumButton title={t('addCustomer')} onPress={addCustomer} size="lg" style={{marginTop: 12}} icon="＋" />
        </GlassCard>

        {loading ? (
          <Text style={styles.loading}>{t('loading')}</Text>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={c => c.id}
            contentContainerStyle={{paddingBottom: 100}}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <GlassCard padding="lg">
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>◈</Text></View>
                  <Text style={styles.emptyTitle}>Nta mukiriya urimo</Text>
                  <Text style={styles.emptySub}>Ongera umukiriya wa mbere — GANZA imukurikirana automatically.</Text>
                </View>
              </GlassCard>
            }
            renderItem={({item}) => (
              <View style={styles.customerCard}>
                <View style={styles.customerLeft}>
                  <View style={styles.avatarBox}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
                  <View>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <Text style={styles.customerPhone}>{item.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteCustomer(item.id)} style={styles.deleteBtn} activeOpacity={0.8}>
                  <View style={styles.deleteBox}><Text style={styles.deleteIcon}>×</Text></View>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14},
  inputWrap: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 12},
  inputIcon: {fontSize: 12, color: '#6B84A0', marginRight: 8},
  input: {flex: 1, paddingVertical: 12, color: '#F1F6FF', fontSize: 14, fontWeight: '500'},
  customerCard: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)'},
  customerLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  avatarBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.16)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  avatarText: {fontSize: 13, fontWeight: '900', color: '#93C5FD'},
  customerName: {color: '#F1F6FF', fontSize: 13, fontWeight: '700'},
  customerPhone: {color: '#8FA2BB', fontSize: 11, marginTop: 2},
  deleteBtn: {marginLeft: 10},
  deleteBox: {width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)', justifyContent: 'center', alignItems: 'center'},
  deleteIcon: {fontSize: 14, color: '#FCA5A5', fontWeight: '700'},
  loading: {color: '#8FA2BB', textAlign: 'center', marginTop: 40, fontSize: 12},
  emptyWrap: {alignItems: 'center', paddingVertical: 12},
  emptyIconBox: {width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 10},
  emptyIcon: {fontSize: 16, color: '#6B84A0'},
  emptyTitle: {fontSize: 13, fontWeight: '700', color: '#EAF2FD'},
  emptySub: {fontSize: 11, color: '#8FA2BB', textAlign: 'center', marginTop: 4, lineHeight: 14},
});
