import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {Card} from '../../components/common/Card';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';

export default function DashboardScreen({navigation}: {navigation: {navigate: (s: string) => void}}) {
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
      const totalStock = (inventory as unknown as Array<{quantity: number}>).reduce((acc: number, i) => acc + (i.quantity || 0), 0);
      const totalValue = (inventory as unknown as Array<{totalValue: number}>).reduce((acc: number, i) => acc + (i.totalValue || 0), 0);
      const dayStart = new Date().setHours(0, 0, 0, 0);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const todaySales = (sales as unknown as Array<{createdAt: number; totalValue: number}>)
        .filter(s => s.createdAt >= dayStart)
        .reduce((acc: number, s) => acc + (s.totalValue || 0), 0);
      const monthlySales = (sales as unknown as Array<{createdAt: number; totalValue: number}>)
        .filter(s => s.createdAt >= monthStart)
        .reduce((acc: number, s) => acc + (s.totalValue || 0), 0);
      const lowStockItems = (inventory as Array<{id: string; name: string; quantity: number}>).filter(i => i.quantity > 0 && i.quantity < 5).slice(0, 5);
      const recentTransactions = (sales as Array<{id: string; itemName: string; quantity: number; totalValue: number; createdAt: number}>)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
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
    }, [loadStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const statCards = [
    {label: t('totalStockValue'), value: formatRWF(stats.totalValue), sub: `${stats.totalStock} pieces`, icon: '💰'},
    {label: t('todaySales'), value: formatRWF(stats.todaySales), sub: "Uyu munsi", icon: '📈'},
    {label: t('monthlySales'), value: formatRWF(stats.monthlySales), sub: "Ukwezi", icon: '📊'},
    {label: t('productCount'), value: String(stats.productCount), sub: `${stats.lowStock} ${t('lowStock')}`, icon: '📦'},
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>
      <Text style={styles.greeting}>{t('welcome')}</Text>
      <Text style={styles.subGreeting}>GANZA • {t('dashboard')}</Text>

      <View style={styles.grid}>
        {statCards.map((card, idx) => (
          <Card key={idx} style={styles.statCard}>
            <Text style={styles.statIcon}>{card.icon}</Text>
            <Text style={styles.statValue} numberOfLines={1}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={styles.statSub}>{card.sub}</Text>
          </Card>
        ))}
      </View>

      {/* Low stock */}
      {stats.lowStockItems.length > 0 && (
        <Card title={`⚠️ ${t('lowStock')} (${stats.lowStock})`} style={styles.alertCard}>
          {stats.lowStockItems.map(item => (
            <View key={item.id} style={styles.lowRow}>
              <Text style={styles.lowName}>{item.name}</Text>
              <Text style={styles.lowQty}>{item.quantity} pcs</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Recent transactions */}
      <Card title={t('recentTransactions')} style={{marginTop: SPACING.md}}>
        {stats.recentTransactions.length === 0 ? (
          <Text style={styles.empty}>{t('noResult')}</Text>
        ) : (
          stats.recentTransactions.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txName}>{tx.itemName}</Text>
                <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString('rw-RW')}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.txValue}>{formatRWF(tx.value)}</Text>
                <Text style={styles.txQty}>{tx.quantity} pcs</Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card title="⚡ Quick Actions" style={{marginTop: SPACING.md}}>
        <Button title={`📷 ${t('scanBoards')}`} onPress={() => navigation.navigate('Scan')} variant="primary" size="lg" style={styles.actionBtn} />
        <Button title={`📦 ${t('inventory')}`} onPress={() => navigation.navigate('Inventory')} variant="secondary" size="lg" style={styles.actionBtn} />
        <Button title={`💰 ${t('sales')}`} onPress={() => navigation.navigate('Sales')} variant="secondary" size="lg" style={styles.actionBtn} />
        <Button title={`📊 ${t('reports')}`} onPress={() => navigation.navigate('Reports')} variant="outline" size="lg" style={styles.actionBtn} />
      </Card>

      {loading && <Text style={styles.loading}>{t('loading')}</Text>}
      <View style={{height: SPACING.xl}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  greeting: {fontSize: FONT_SIZES.xxl, color: COLORS.cream, fontWeight: '900', marginBottom: 4},
  subGreeting: {fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING.lg, letterSpacing: 0.8, textTransform: 'uppercase'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  statCard: {width: '48%', marginBottom: SPACING.md, minHeight: 118},
  statIcon: {fontSize: 22, marginBottom: SPACING.sm},
  statValue: {fontSize: 18, color: COLORS.gold, fontWeight: '900'},
  statLabel: {fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5},
  statSub: {fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  alertCard: {borderColor: COLORS.warning, borderWidth: 1, marginTop: SPACING.md},
  lowRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  lowName: {color: COLORS.text, fontSize: FONT_SIZES.sm},
  lowQty: {color: COLORS.warning, fontWeight: '700', fontSize: FONT_SIZES.sm},
  txRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  txName: {color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZES.sm},
  txDate: {color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2},
  txValue: {color: COLORS.gold, fontWeight: '700', fontSize: FONT_SIZES.sm},
  txQty: {color: COLORS.textMuted, fontSize: FONT_SIZES.xs, textAlign: 'right'},
  empty: {color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.md},
  actionBtn: {marginBottom: SPACING.sm},
  loading: {color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl},
});
