import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';
import {AmbientBackground} from '../../components/premium/AmbientBackground';

export default function DashboardScreen({navigation}: {navigation: {navigate: (s: string, p?: unknown) => void}}) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [stats, setStats] = useState({
    totalStock: 0,
    totalValue: 0,
    todaySales: 0,
    monthlySales: 0,
    productCount: 0,
    lowStock: 0,
    lowStockItems: [] as {id: string; name: string; quantity: number}[],
    recentTransactions: [] as {id: string; itemName: string; quantity: number; value: number; date: number}[],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const businessId = user?.businessId || user?.uid || 'default-business';
    try {
      const [inventory, sales] = await Promise.all([
        firebaseService.getInventory(businessId).catch(() => []),
        firebaseService.getSales(businessId).catch(() => []),
      ]);
      const totalStock = (inventory as Array<{quantity: number}>).reduce((acc, i) => acc + (i.quantity || 0), 0);
      const totalValue = (inventory as Array<{totalValue: number}>).reduce((acc, i) => acc + (i.totalValue || 0), 0);
      const dayStart = new Date().setHours(0, 0, 0, 0);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const todaySales = (sales as Array<{createdAt: number; totalValue: number}>)
        .filter(s => s.createdAt >= dayStart)
        .reduce((acc, s) => acc + (s.totalValue || 0), 0);
      const monthlySales = (sales as Array<{createdAt: number; totalValue: number}>)
        .filter(s => s.createdAt >= monthStart)
        .reduce((acc, s) => acc + (s.totalValue || 0), 0);
      const lowStockItems = (inventory as Array<{id: string; name: string; quantity: number}>).filter(i => i.quantity > 0 && i.quantity < 5).slice(0, 3);
      const recentTransactions = (sales as Array<{id: string; itemName: string; quantity: number; totalValue: number; createdAt: number}>)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4)
        .map(s => ({id: s.id, itemName: s.itemName, quantity: s.quantity, value: s.totalValue, date: s.createdAt}));
      setStats({
        totalStock,
        totalValue,
        todaySales,
        monthlySales,
        productCount: inventory.length,
        lowStock: lowStockItems.length,
        lowStockItems,
        recentTransactions,
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.businessId, user?.uid]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const now = new Date();
  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12 ? 'Mwaramutse' : greetingHour < 18 ? 'Mwiriwe' : 'Mwiriwe neza';

  return (
    <AmbientBackground>
      <GanzaHeader
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('Profile')}
        notificationCount={stats.lowStock}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome + Agent State */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{greeting} — GANZA</Text>
          <Text style={styles.greetingSub}>Agent yawe y'ubwenge iri maso • Igenzura telephone na computer</Text>
        </View>

        {/* AGENT OPERATIONAL CARD — hero */}
        <GlassCard variant="luminous" padding="lg" style={styles.agentCard}>
          <View style={styles.agentHeader}>
            <View style={styles.agentTitleRow}>
              <View style={styles.agentIconBox}>
                <Text style={styles.agentIcon}>✦</Text>
              </View>
              <View>
                <Text style={styles.agentTitle}>GANZA AI Agent</Text>
                <Text style={styles.agentSubtitle}>Autonomous • Operational • Precision</Text>
              </View>
            </View>
            <StatusPill status="active" label="Active" />
          </View>

          <View style={styles.agentMetrics}>
            <View style={styles.metric}>
              <View style={styles.metricIconWrap}>
                <Text style={styles.metricIcon}>⬢</Text>
              </View>
              <Text style={styles.metricLabel}>Task Queue</Text>
              <Text style={styles.metricValue}>12</Text>
              <Text style={styles.metricSub}>3 bikora</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <View style={styles.metricIconWrap}>
                <Text style={styles.metricIcon}>◈</Text>
              </View>
              <Text style={styles.metricLabel}>Automation</Text>
              <Text style={styles.metricValue}>98.4%</Text>
              <Text style={styles.metricSub}>Precision</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <View style={styles.metricIconWrap}>
                <Text style={styles.metricIcon}>⬡</Text>
              </View>
              <Text style={styles.metricLabel}>Uptime</Text>
              <Text style={styles.metricValue}>24/7</Text>
              <Text style={styles.metricSub}>Bikora</Text>
            </View>
          </View>

          {/* Device connection status */}
          <View style={styles.deviceRow}>
            <View style={styles.devicePill}>
              <View style={styles.dotGreen} />
              <Text style={styles.deviceText}>Telephone</Text>
              <Text style={styles.deviceStatus}>Connected</Text>
            </View>
            <View style={styles.devicePill}>
              <View style={styles.dotGreen} />
              <Text style={styles.deviceText}>Computer</Text>
              <Text style={styles.deviceStatus}>Synced</Text>
            </View>
            <View style={styles.devicePillMuted}>
              <View style={styles.dotAmber} />
              <Text style={styles.deviceTextMuted}>Cloud</Text>
              <Text style={styles.deviceStatusMuted}>Syncing</Text>
            </View>
          </View>

          <View style={styles.agentActions}>
            <PremiumButton title="Fungura AI Agent" onPress={() => navigation.navigate('AIAgent')} size="md" style={{flex: 1}} icon="✦" />
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Devices')} activeOpacity={0.8}>
              <Text style={styles.secondaryActionText}>Ibikoresho</Text>
              <Text style={styles.secondaryActionIcon}>⬢</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* TESTING CENTER — Hero (mandatory) */}
        <TouchableOpacity onPress={() => navigation.navigate('TestingCenter')} activeOpacity={0.88} style={styles.testingHeroWrap}>
          <GlassCard variant="luminous" padding="lg" style={styles.testingHero}>
            <LinearGradient colors={['rgba(59,130,246,0.16)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={styles.testingGlow} />
            <View style={styles.testingHeader}>
              <View style={styles.testingIconBox}><Text style={styles.testingIcon}>◈</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.testingTitle}>TESTING CENTER</Text>
                <Text style={styles.testingSub}>Source of Truth • Create test • Verify with evidence</Text>
              </View>
              <View style={styles.testingArrowBox}><Text style={styles.testingArrow}>→</Text></View>
            </View>
            <View style={styles.testingMetrics}>
              <View style={styles.testingMetric}><Text style={styles.testingMetricValue}>OBSERVE → PLAN → ACT → VERIFY</Text><Text style={styles.testingMetricLabel}>Universal Loop</Text></View>
            </View>
            <View style={styles.testingDeviceRow}>
              <View style={styles.testingDevicePill}><Text style={styles.testingDeviceText}>○ Android</Text></View>
              <View style={styles.testingDevicePill}><Text style={styles.testingDeviceText}>○ Windows</Text></View>
              <View style={styles.testingDevicePillActive}><Text style={styles.testingDeviceTextActive}>● TEST LAB</Text></View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Premium stats grid — metallic */}
        <View style={styles.grid}>
          <GlassCard style={styles.statCard} padding="md">
            <View style={styles.statIconRow}>
              <View style={[styles.statIconBox, styles.statIconBlue]}><Text style={styles.statIcon}>◆</Text></View>
              <StatusPill status="success" label="+12%" />
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{formatRWF(stats.totalValue)}</Text>
            <Text style={styles.statLabel}>Agaciro k'ububiko</Text>
            <Text style={styles.statSub}>{stats.totalStock} ibice • {stats.productCount} products</Text>
            <View style={styles.miniBar}><View style={[styles.miniBarFill, {width: '72%'}]} /></View>
          </GlassCard>

          <GlassCard style={styles.statCard} padding="md">
            <View style={styles.statIconRow}>
              <View style={[styles.statIconBox, styles.statIconCyan]}><Text style={styles.statIcon}>⬡</Text></View>
              <StatusPill status="busy" label="Uyu munsi" />
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{formatRWF(stats.todaySales)}</Text>
            <Text style={styles.statLabel}>Igurisha ry'uyu munsi</Text>
            <Text style={styles.statSub}>Bikurikiranywa na AI</Text>
            <View style={styles.miniBar}><View style={[styles.miniBarFill, {width: '45%', backgroundColor: '#38BDF8'}]} /></View>
          </GlassCard>

          <GlassCard style={styles.statCard} padding="md">
            <View style={styles.statIconRow}>
              <View style={[styles.statIconBox, styles.statIconSteel]}><Text style={styles.statIcon}>▭</Text></View>
              <StatusPill status="idle" label="Ukwezi" />
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{formatRWF(stats.monthlySales)}</Text>
            <Text style={styles.statLabel}>Igurisha ry'ukwezi</Text>
            <Text style={styles.statSub}>Raporo zikora automatic</Text>
            <View style={styles.miniBar}><View style={[styles.miniBarFill, {width: '64%', backgroundColor: '#8EA7C4'}]} /></View>
          </GlassCard>

          <GlassCard style={[styles.statCard, stats.lowStock > 0 && styles.statCardWarning]} padding="md" variant={stats.lowStock > 0 ? 'accent' : 'default'}>
            <View style={styles.statIconRow}>
              <View style={[styles.statIconBox, stats.lowStock > 0 ? styles.statIconAmber : styles.statIconSteel]}>
                <Text style={styles.statIcon}>⬢</Text>
              </View>
              {stats.lowStock > 0 ? <StatusPill status="warning" label="Alert" /> : <StatusPill status="idle" label="Stable" />}
            </View>
            <Text style={[styles.statValue, stats.lowStock > 0 && styles.statValueWarning]}>{stats.productCount}</Text>
            <Text style={styles.statLabel}>Ububiko</Text>
            <Text style={[styles.statSub, stats.lowStock > 0 && styles.statSubWarning]}>{stats.lowStock} ibura • Kugenzura</Text>
            <View style={styles.miniBar}><View style={[styles.miniBarFill, {width: `${Math.max(18, 100 - stats.lowStock * 18)}%`, backgroundColor: stats.lowStock > 0 ? '#F59E0B' : '#6B84A0'}]} /></View>
          </GlassCard>
        </View>

        {/* Active Tasks — intelligent operational */}
        <GlassCard title="Imirimo ikora" subtitle="AI Agent irimo kubigenzura • 3 active" icon="⬡" headerRight={<TouchableOpacity onPress={() => navigation.navigate('TasksModal')}><Text style={styles.link}>Reba zose →</Text></TouchableOpacity>}>
          <View style={styles.taskList}>
            <View style={[styles.taskItem, styles.taskItemActive]}>
              <View style={styles.taskLeft}>
                <View style={[styles.taskDot, styles.taskDotActive]}><View style={styles.taskDotInner} /></View>
                <View>
                  <Text style={styles.taskName}>Scan & kubara imbaho</Text>
                  <Text style={styles.taskMeta}>AI Vision • 14 imbaho zabonetse • 94% confidence</Text>
                </View>
              </View>
              <StatusPill status="busy" label="Active" />
            </View>
            <View style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <View style={styles.taskDot}><Text style={styles.taskDotIcon}>▭</Text></View>
                <View>
                  <Text style={styles.taskName}>Kuvugurura ububiko</Text>
                  <Text style={styles.taskMeta}>Auto-sync • Telephone ↔ Computer</Text>
                </View>
              </View>
              <StatusPill status="active" label="Syncing" />
            </View>
            <View style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <View style={styles.taskDot}><Text style={styles.taskDotIcon}>◈</Text></View>
                <View>
                  <Text style={styles.taskName}>Raporo y'ukwezi</Text>
                  <Text style={styles.taskMeta}>Kora report • Itegura</Text>
                </View>
              </View>
              <StatusPill status="idle" label="Queued" />
            </View>
          </View>
        </GlassCard>

        {/* Low stock alert — glass */}
        {stats.lowStockItems.length > 0 && (
          <GlassCard title="Ibyo bikenerwa vuba" subtitle={`${stats.lowStock} ibicuruzwa bikenewe kongerwamo`} icon="⬢" variant="accent" style={{marginTop: SPACING.md}}>
            {stats.lowStockItems.map(item => (
              <View key={item.id} style={styles.lowRow}>
                <View style={styles.lowLeft}>
                  <View style={styles.lowIconBox}><Text style={styles.lowIcon}>⬢</Text></View>
                  <Text style={styles.lowName}>{item.name}</Text>
                </View>
                <View style={styles.lowRight}>
                  <Text style={styles.lowQty}>{item.quantity} pcs</Text>
                  <View style={styles.lowWarnPill}><Text style={styles.lowWarnText}>Low</Text></View>
                </View>
              </View>
            ))}
            <PremiumButton title="Kongera stock" onPress={() => navigation.navigate('Inventory')} variant="ghost" size="sm" style={{marginTop: SPACING.md}} />
          </GlassCard>
        )}

        {/* System Activity — timeline */}
        <GlassCard title="Ibikorwa bya vuba" subtitle="System activity • Real-time" icon="◈" headerRight={<TouchableOpacity onPress={() => navigation.navigate('Activity')}><Text style={styles.link}>Byose →</Text></TouchableOpacity>} style={{marginTop: SPACING.md}}>
          {stats.recentTransactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>◈</Text></View>
              <Text style={styles.empty}>Nta bikorwa biheruka</Text>
              <Text style={styles.emptySub}>Ibikorwa bya AI bizagaragara hano</Text>
            </View>
          ) : (
            stats.recentTransactions.map((tx, idx) => (
              <View key={tx.id} style={[styles.txRow, idx === stats.recentTransactions.length - 1 && styles.txRowLast]}>
                <View style={styles.txTimeline}>
                  <View style={styles.txDot} />
                  {idx !== stats.recentTransactions.length - 1 && <View style={styles.txLine} />}
                </View>
                <View style={styles.txBody}>
                  <View style={styles.txTopRow}>
                    <Text style={styles.txName}>{tx.itemName}</Text>
                    <Text style={styles.txValue}>{formatRWF(tx.value)}</Text>
                  </View>
                  <View style={styles.txBottomRow}>
                    <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString('rw-RW')} • {tx.quantity} pcs</Text>
                    <View style={styles.txStatus}><View style={styles.txStatusDot} /><Text style={styles.txStatusText}>Confirmed</Text></View>
                  </View>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        {/* Quick Actions — premium metallic */}
        <GlassCard title="Ibyihuse" subtitle="Quick actions" icon="✦" style={{marginTop: SPACING.md}}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionPrimary} onPress={() => navigation.navigate('Scan')} activeOpacity={0.88}>
              <LinearGradient colors={['#60A5FA', '#3B82F6', '#2563EB'] as unknown as string[]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
              <View style={styles.actionPrimarySheen} />
              <Text style={styles.actionPrimaryIcon}>⬢</Text>
              <Text style={styles.actionPrimaryText}>Scan Imbaho</Text>
              <Text style={styles.actionPrimarySub}>AI Vision • Fata ifoto</Text>
            </TouchableOpacity>

            <View style={styles.actionsRight}>
              <TouchableOpacity style={styles.actionGlass} onPress={() => navigation.navigate('Inventory')} activeOpacity={0.85}>
                <Text style={styles.actionGlassIcon}>⬡</Text>
                <Text style={styles.actionGlassText}>Ububiko</Text>
                <Text style={styles.actionGlassSub}>{stats.productCount} items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGlass} onPress={() => navigation.navigate('Sales')} activeOpacity={0.85}>
                <Text style={styles.actionGlassIcon}>◆</Text>
                <Text style={styles.actionGlassText}>Igurisha</Text>
                <Text style={styles.actionGlassSub}>Gurisha</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.actionWide} onPress={() => navigation.navigate('Reports')} activeOpacity={0.85}>
            <Text style={styles.actionWideIcon}>▭</Text>
            <Text style={styles.actionWideText}>Raporo & Igenamiterere</Text>
            <Text style={styles.actionWideArrow}>→</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Trust footer */}
        <View style={styles.trustFooter}>
          <View style={styles.trustRow}>
            <View style={styles.trustPill}><View style={styles.trustDot} /><Text style={styles.trustText}>Encrypted</Text></View>
            <View style={styles.trustPill}><View style={styles.trustDotBlue} /><Text style={styles.trustText}>On-device AI</Text></View>
            <View style={styles.trustPill}><View style={styles.trustDotSteel} /><Text style={styles.trustText}>Premium</Text></View>
          </View>
          <Text style={styles.trustSub}>GANZA • Autonomous AI — Yizewe, yihuse, ifite ubwenge</Text>
        </View>

        {loading && <Text style={styles.loading}>Bikoresha...</Text>}
        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 8},
  welcomeSection: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#F1F6FF',
    lineHeight: 26,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8FA2BB',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  agentCard: {
    marginBottom: SPACING.md,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  agentIcon: {
    fontSize: 16,
    color: '#93C5FD',
    fontWeight: '700',
  },
  agentTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#EAF2FD',
  },
  agentSubtitle: {
    fontSize: 11,
    color: '#6B84A0',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  agentMetrics: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricIcon: {
    fontSize: 13,
    color: '#CBD8E6',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#8FA2BB',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F1F6FF',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  metricSub: {
    fontSize: 10,
    color: '#5E728C',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
    marginRight: 8,
  },
  devicePillMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  dotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  deviceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EAF2FD',
    marginRight: 6,
  },
  deviceStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6EE7B7',
  },
  deviceTextMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8FA2BB',
    marginRight: 6,
  },
  deviceStatusMuted: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B84A0',
  },
  agentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryAction: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#CBD8E6',
    marginRight: 6,
  },
  secondaryActionIcon: {
    fontSize: 12,
    color: '#8FA2BB',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: SPACING.md,
    minHeight: 148,
  },
  statCardWarning: {},
  statIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconBlue: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(96,165,250,0.18)',
  },
  statIconCyan: {
    backgroundColor: 'rgba(56,189,248,0.10)',
    borderColor: 'rgba(56,189,248,0.16)',
  },
  statIconSteel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statIconAmber: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.18)',
  },
  statIcon: {
    fontSize: 13,
    color: '#EAF2FD',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#F1F6FF',
    marginTop: 2,
  },
  statValueWarning: {
    color: '#FCD34D',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#8FA2BB',
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    color: '#5E728C',
    marginTop: 3,
    lineHeight: 13,
  },
  statSubWarning: {
    color: '#D1A540',
  },
  miniBar: {
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  link: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#93C5FD',
  },
  taskList: {},
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  taskItemActive: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(96,165,250,0.16)',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  taskDot: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  taskDotActive: {
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderColor: 'rgba(96,165,250,0.22)',
  },
  taskDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60A5FA',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  taskDotIcon: {
    fontSize: 14,
    color: '#8FA2BB',
  },
  taskName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F6FF',
  },
  taskMeta: {
    fontSize: 11,
    color: '#8FA2BB',
    marginTop: 2,
  },
  lowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  lowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lowIcon: {
    fontSize: 12,
    color: '#CBD8E6',
  },
  lowName: {
    color: '#EAF2FD',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  lowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lowQty: {
    color: '#FCD34D',
    fontWeight: '800',
    fontSize: 12,
    marginRight: 8,
  },
  lowWarnPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.20)',
  },
  lowWarnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  txRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  txRowLast: {
    paddingBottom: 0,
  },
  txTimeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  txDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
    borderWidth: 2,
    borderColor: 'rgba(96,165,250,0.25)',
    marginTop: 6,
  },
  txLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginTop: 6,
    marginBottom: -6,
  },
  txBody: {
    flex: 1,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txName: {
    color: '#EAF2FD',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  txValue: {
    color: '#93C5FD',
    fontWeight: '800',
    fontSize: 12,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  txDate: {
    color: '#6B84A0',
    fontSize: 11,
  },
  txStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6EE7B7',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 20,
    color: '#6B84A0',
  },
  empty: {
    color: '#8FA2BB',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  emptySub: {
    color: '#5E728C',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  actionPrimary: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
    minHeight: 118,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  actionPrimarySheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  actionPrimaryIcon: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 8,
  },
  actionPrimaryText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.2,
  },
  actionPrimarySub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
    fontWeight: '500',
  },
  actionsRight: {
    flex: 1,
  },
  actionGlass: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
    justifyContent: 'center',
  },
  actionGlassIcon: {
    fontSize: 16,
    color: '#CBD8E6',
    marginBottom: 4,
  },
  actionGlassText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EAF2FD',
    letterSpacing: 0.2,
  },
  actionGlassSub: {
    fontSize: 11,
    color: '#8FA2BB',
    marginTop: 2,
  },
  actionWide: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  actionWideIcon: {
    fontSize: 16,
    color: '#8FA2BB',
    marginRight: 10,
  },
  actionWideText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#EAF2FD',
    letterSpacing: 0.2,
  },
  actionWideArrow: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '700',
  },
  trustFooter: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 4,
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  trustDotBlue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 6,
  },
  trustDotSteel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8FA2BB',
    marginRight: 6,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8FA2BB',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  trustSub: {
    fontSize: 10,
    color: '#5E728C',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  loading: {
    color: '#8FA2BB',
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontSize: 12,
  },
  testingHeroWrap: {marginBottom: SPACING.md},
  testingHero: {overflow: 'hidden', position: 'relative'},
  testingGlow: {position: 'absolute', top: -40, left: -40, right: -40, height: 120, opacity: 0.6},
  testingHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  testingIconBox: {width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.14)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.22)', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  testingIcon: {fontSize: 16, color: '#93C5FD'},
  testingTitle: {fontSize: 14, fontWeight: '900', color: '#F1F6FF', letterSpacing: 0.8},
  testingSub: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  testingArrowBox: {width: 32, height: 32, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)'},
  testingArrow: {fontSize: 14, color: '#fff', fontWeight: '800'},
  testingMetrics: {backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center'},
  testingMetric: {alignItems: 'center'},
  testingMetricValue: {fontSize: 10, fontWeight: '800', color: '#93C5FD', letterSpacing: 0.6, textAlign: 'center'},
  testingMetricLabel: {fontSize: 9, fontWeight: '700', color: '#8FA2BB', marginTop: 2, letterSpacing: 0.6, textTransform: 'uppercase'},
  testingDeviceRow: {flexDirection: 'row', marginTop: 10},
  testingDevicePill: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginRight: 8},
  testingDeviceText: {fontSize: 10, fontWeight: '700', color: '#8FA2BB'},
  testingDevicePillActive: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.18)', marginRight: 8},
  testingDeviceTextActive: {fontSize: 10, fontWeight: '800', color: '#6EE7B7'},
});
