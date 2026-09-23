import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
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
    if (!user?.businessId) return;
    setLoading(true);
    try {
      const [sales, inventory] = await Promise.all([
        firebaseService.getSales(user.businessId),
        firebaseService.getInventory(user.businessId),
      ]);
      setReportData({sales, inventory});
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = reportData?.sales?.reduce((acc: number, s: any) => acc + s.totalValue, 0) || 0;
  const totalItems = reportData?.inventory?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0;
  const totalValue = reportData?.inventory?.reduce((acc: number, i: any) => acc + i.totalValue, 0) || 0;

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation?.navigate('Notifications')} onProfilePress={() => navigation?.navigate('Profile')} />
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Raporo</Text>
        <Text style={styles.subtitle}>Igenamiterere • AI insight • Premium analytics</Text>

        {/* Hero metric */}
        <GlassCard variant="luminous" padding="lg" style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}><Text style={styles.heroIcon}>▭</Text></View>
            <View>
              <Text style={styles.heroLabel}>Overview • Real-time</Text>
              <Text style={styles.heroSub}>Ganza AI irakora raporo yihuse</Text>
            </View>
            <StatusPill status="busy" label="Live" />
          </View>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Sales</Text>
              <Text style={styles.heroMetricValue}>{formatRWF(totalSales)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Items</Text>
              <Text style={styles.heroMetricValue}>{totalItems}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Value</Text>
              <Text style={styles.heroMetricValue}>{formatRWF(totalValue)}</Text>
            </View>
          </View>
          {/* Mini chart bars */}
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

        <GlassCard title="System Intelligence" subtitle="AI insights" icon="✦" variant="accent">
          <View style={styles.insightRow}>
            <View style={styles.insightDotGreen} />
            <Text style={styles.insightText}>Igurisha ryiyongereye 12% muri iki cyumweru — AI iragusaba kongera stock ya imbaho nini.</Text>
          </View>
          <View style={styles.insightRow}>
            <View style={styles.insightDotBlue} />
            <Text style={styles.insightText}>Precision 98.4% • Scan 47 imbaho mu minsi 7 — nta makosa.</Text>
          </View>
          <View style={styles.insightRow}>
            <View style={styles.insightDotSteel} />
            <Text style={styles.insightText}>Raporo izoherezwa auto kuri email yawe ejo 08:00.</Text>
          </View>
        </GlassCard>

        {reportData ? (
          <GlassCard title="Sales Breakdown" subtitle={`${reportData.sales.length} transactions`} icon="◆" style={{marginTop: 14}}>
            {reportData.sales.slice(-10).map((s: any) => (
              <View key={s.id} style={styles.saleRow}>
                <View style={styles.saleLeft}>
                  <View style={styles.saleIconBox}><Text style={styles.saleIcon}>◆</Text></View>
                  <View>
                    <Text style={styles.saleItemName}>{s.itemName}</Text>
                    <Text style={styles.saleItemMeta}>{new Date(s.createdAt).toLocaleDateString('rw-RW')} • {s.quantity} pcs</Text>
                  </View>
                </View>
                <Text style={styles.saleItemAmount}>{formatRWF(s.totalValue)}</Text>
              </View>
            ))}
          </GlassCard>
        ) : (
          <GlassCard style={{marginTop: 14}} padding="lg">
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>▭</Text></View>
              <Text style={styles.emptyTitle}>Kanda "Kora raporo" kugira ngo ubone analytics</Text>
              <Text style={styles.emptySub}>GANZA AI izakora raporo yuzuye — graphs, insights, na recommendations.</Text>
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
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
  chart: {flexDirection: 'row', alignItems: 'flex-end', height: 90, marginTop: 14, justifyContent: 'space-between'},
  barWrap: {flex: 1, marginHorizontal: 2, justifyContent: 'flex-end', alignItems: 'center'},
  bar: {width: '100%', borderRadius: 6, minHeight: 8, maxWidth: 22},
  chartLabels: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2},
  chartLabel: {fontSize: 10, color: '#6B84A0', fontWeight: '600'},
  button: {marginTop: 4, marginBottom: 4},
  insightRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8},
  insightDotGreen: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginTop: 6, marginRight: 10},
  insightDotBlue: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA', marginTop: 6, marginRight: 10},
  insightDotSteel: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#8FA2BB', marginTop: 6, marginRight: 10},
  insightText: {flex: 1, fontSize: 12, color: '#CBD8E6', lineHeight: 16},
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
});
