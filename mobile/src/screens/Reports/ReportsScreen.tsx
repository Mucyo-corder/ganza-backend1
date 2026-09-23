import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {SPACING} from '../../constants/theme';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';

export default function ReportsScreen({navigation}: {navigation?: {navigate: (s: string) => void}}) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [reportData, setReportData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const generateReport = async () => {
    const businessId = user?.businessId || user?.uid || 'default-business';
    if (!businessId) return;
    setLoading(true);
    try {
      const [sales, inventory] = await Promise.all([
        firebaseService.getSales(businessId).catch(() => []),
        firebaseService.getInventory(businessId).catch(() => []),
      ]);
      setReportData({sales, inventory});
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = reportData?.sales?.reduce((acc: number, s: any) => acc + (s.totalValue || 0), 0) || 0;
  const totalItems = reportData?.inventory?.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0) || 0;
  const totalValue = reportData?.inventory?.reduce((acc: number, i: any) => acc + (i.totalValue || 0), 0) || 0;
  const totalVolume = reportData?.inventory?.reduce((acc: number, i: any) => acc + (i.volumeM3 || 0), 0) || 0;

  const exportReport = (format: 'PDF' | 'CSV' | 'JSON') => {
    if (!reportData) {
      Alert.alert('Banza ukore raporo');
      return;
    }
    if (format === 'JSON') {
      const json = JSON.stringify({generatedAt: new Date().toISOString(), inventory: reportData.inventory, sales: reportData.sales}, null, 2);
      Alert.alert('JSON Export', json.slice(0, 900) + (json.length > 900 ? '…' : ''));
      return;
    }
    if (format === 'CSV') {
      const header = 'id,name,quantity,unitPrice,totalValue,volumeM3\n';
      const rows = (reportData.inventory as any[]).map((i: any) => `${i.id},"${i.name}",${i.quantity},${i.unitPrice},${i.totalValue},${i.volumeM3 || ''}`).join('\n');
      const csv = header + rows;
      Alert.alert('CSV Export', csv.slice(0, 900) + (csv.length > 900 ? '…' : ''));
      return;
    }
    // PDF — not fully implemented on device, honest placeholder
    Alert.alert('PDF', 'PDF export requires native generation — data is ready, but PDF rendering is Not implemented on this device. Use CSV/JSON for now.');
  };

  return (
    <AmbientBackground>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
        <GanzaHeader variant="compact" onNotificationPress={() => navigation?.navigate('Notifications')} onProfilePress={() => navigation?.navigate('Profile')} />
        <Text style={styles.title}>Raporo</Text>
        <Text style={styles.subtitle}>Buri munsi • Buri cyumweru • Buri kwezi • Ububiko n'ubucuruzi</Text>

        <GlassCard variant="luminous" padding="lg" style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}><Text style={styles.heroIcon}>▭</Text></View>
            <View>
              <Text style={styles.heroLabel}>Overview</Text>
              <Text style={styles.heroSub}>Stock • Sales • Value</Text>
            </View>
            <StatusPill status="idle" label="Live" />
          </View>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Sales</Text>
              <Text style={styles.heroMetricValue}>{formatRWF(totalSales)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Pieces</Text>
              <Text style={styles.heroMetricValue}>{totalItems}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Value</Text>
              <Text style={styles.heroMetricValue}>{formatRWF(totalValue)}</Text>
            </View>
          </View>
          {totalVolume > 0 && <Text style={styles.volumeHint}>Volume: {totalVolume.toFixed(3)} m³</Text>}
          <View style={styles.chart}>
            {[35, 62, 48, 85, 54, 72, 90, 68, 75, 58].map((h, i) => (
              <View key={i} style={styles.barWrap}>
                <LinearGradient colors={i === 6 ? ['#60A5FA', '#3B82F6'] as unknown as string[] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'] as unknown as string[]} style={[styles.bar, {height: h}]} />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Mon</Text>
            <Text style={styles.chartLabel}>Sun</Text>
          </View>
        </GlassCard>

        <PremiumButton title={t('generateReport')} onPress={generateReport} loading={loading} size="lg" style={styles.button} icon="▭" />

        <View style={styles.exportRow}>
          {(['PDF', 'CSV', 'JSON'] as const).map(f => (
            <TouchableOpacity key={f} style={styles.exportChip} onPress={() => exportReport(f)} activeOpacity={0.85}>
              <Text style={styles.exportText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {reportData ? (
          <>
            <GlassCard title="Sales Breakdown" subtitle={`${reportData.sales.length} transactions`} icon="◆" style={{marginTop: 14}}>
              {reportData.sales.slice(-10).map((s: any) => (
                <View key={s.id} style={styles.saleRow}>
                  <View style={styles.saleLeft}>
                    <View style={styles.saleIconBox}><Text style={styles.saleIcon}>◆</Text></View>
                    <View>
                      <Text style={styles.saleItemName}>{s.itemName}</Text>
                      <Text style={styles.saleItemMeta}>{new Date(s.createdAt).toLocaleDateString('rw-RW')} • {s.quantity} imbaho</Text>
                    </View>
                  </View>
                  <Text style={styles.saleItemAmount}>{formatRWF(s.totalValue)}</Text>
                </View>
              ))}
            </GlassCard>
            <GlassCard title="Stock Summary" subtitle={`${reportData.inventory.length} items`} icon="⬡" style={{marginTop: 12}}>
              <Text style={styles.summaryText}>Total imbaho: {totalItems} • Total value: {formatRWF(totalValue)} {totalVolume > 0 ? `• Volume: ${totalVolume.toFixed(3)} m³` : ''}</Text>
            </GlassCard>
          </>
        ) : (
          <GlassCard style={{marginTop: 14}} padding="lg">
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>▭</Text></View>
              <Text style={styles.emptyTitle}>Kanda "Kora raporo"</Text>
              <Text style={styles.emptySub}>Raporo y'ukwezi, icyumweru, umunsi — PDF, CSV, JSON.</Text>
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 2},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14},
  hero: {marginBottom: 14},
  heroHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
  heroIconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  heroIcon: {fontSize: 14, color: '#93C5FD'},
  heroLabel: {fontSize: 10, fontWeight: '800', color: '#8FA2BB', letterSpacing: 0.7, textTransform: 'uppercase'},
  heroSub: {fontSize: 11, color: '#6B84A0', marginTop: 2},
  heroMetrics: {flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden'},
  heroMetric: {flex: 1, alignItems: 'center', paddingVertical: 12},
  heroMetricLabel: {fontSize: 10, fontWeight: '700', color: '#8FA2BB', letterSpacing: 0.6, textTransform: 'uppercase'},
  heroMetricValue: {fontSize: 14, fontWeight: '900', color: '#F1F6FF', marginTop: 4},
  heroDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 10},
  volumeHint: {fontSize: 11, color: '#8FA2BB', textAlign: 'center', marginTop: 8},
  chart: {flexDirection: 'row', alignItems: 'flex-end', height: 90, marginTop: 14, justifyContent: 'space-between'},
  barWrap: {flex: 1, marginHorizontal: 2, justifyContent: 'flex-end', alignItems: 'center'},
  bar: {width: '100%', borderRadius: 6, minHeight: 8, maxWidth: 22},
  chartLabels: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2},
  chartLabel: {fontSize: 10, color: '#6B84A0', fontWeight: '600'},
  button: {marginTop: 4, marginBottom: 8},
  exportRow: {flexDirection: 'row', justifyContent: 'center', marginBottom: 4},
  exportChip: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4},
  exportText: {fontSize: 11, fontWeight: '800', color: '#CBD8E6', letterSpacing: 0.6},
  saleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  saleLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  saleIconBox: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  saleIcon: {fontSize: 12, color: '#8FA2BB'},
  saleItemName: {color: '#F1F6FF', fontSize: 13, fontWeight: '600'},
  saleItemMeta: {color: '#8FA2BB', fontSize: 11, marginTop: 2},
  saleItemAmount: {color: '#93C5FD', fontWeight: '800', fontSize: 12},
  emptyWrap: {alignItems: 'center', paddingVertical: 8},
  emptyIconBox: {width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  emptyIcon: {fontSize: 18, color: '#6B84A0'},
  emptyTitle: {fontSize: 13, fontWeight: '700', color: '#EAF2FD', textAlign: 'center'},
  emptySub: {fontSize: 11, color: '#8FA2BB', textAlign: 'center', marginTop: 6, lineHeight: 14},
  summaryText: {fontSize: 12, color: '#CBD8E6', lineHeight: 16},
});
