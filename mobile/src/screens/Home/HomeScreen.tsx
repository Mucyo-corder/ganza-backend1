import React from 'react';
import {View, ScrollView, Text, StyleSheet} from 'react-native';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {useState, useEffect} from 'react';

export default function HomeScreen() {
  const {user} = useAuth();
  const {t} = useLocalization();
  const [dashboardData, setDashboardData] = useState({
    totalStock: 0,
    totalInventoryValue: 0,
    todaySales: 0,
    monthlySales: 0,
    numberOfProducts: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.businessId) return;
    try {
      const inventory = await firebaseService.getInventory(user.businessId);
      const sales = await firebaseService.getSales(user.businessId);
      const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
      const totalValue = inventory.reduce((acc, item) => acc + item.totalValue, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      const todaySales = sales
        .filter(s => new Date(s.createdAt).getTime() >= today)
        .reduce((acc, s) => acc + s.totalValue, 0);
      setDashboardData({
        totalStock,
        totalInventoryValue: totalValue,
        todaySales,
        monthlySales: totalSales(sales),
        numberOfProducts: inventory.length,
        lowStockItems: inventory.filter(i => i.quantity < 5).length,
      });
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  const totalSales = (sales: any[]) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return sales.filter(s => s.createdAt >= monthStart).reduce((acc, s) => acc + s.totalValue, 0);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>{t('welcome')}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.grid}>
        <Card style={styles.gridCard} title={t('totalStockValue')}>
          <Text style={styles.bigNumber}>{formatRWF(dashboardData.totalInventoryValue)}</Text>
        </Card>
        <Card style={styles.gridCard} title={t('todaySales')}>
          <Text style={styles.bigNumber}>{formatRWF(dashboardData.todaySales)}</Text>
        </Card>
        <Card style={styles.gridCard} title={t('productCount')}>
          <Text style={styles.bigNumber}>{dashboardData.numberOfProducts}</Text>
        </Card>
        <Card style={styles.gridCard} title={t('lowStock')}>
          <Text style={styles.bigNumber}>{dashboardData.lowStockItems}</Text>
        </Card>
      </View>

      <Card title={t('recentTransactions')}>
        <Text style={styles.noDataText}>{t('noResult')}</Text>
      </Card>

      <Button title={t('scanBoards')} onPress={() => {}} variant="primary" size="lg" style={styles.scanButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.cream,
  },
  userEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  gridCard: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  bigNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.gold,
  },
  noDataText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  scanButton: {
    marginTop: SPACING.md,
    alignSelf: 'stretch',
  },
});
