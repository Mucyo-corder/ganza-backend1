import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {Card} from '../../components/common/Card';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';

export default function ReportsScreen() {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [reportData, setReportData] = React.useState(null);

  const generateReport = async () => {
    if (!user?.businessId) return;
    try {
      const [sales, inventory] = await Promise.all([
        firebaseService.getSales(user.businessId),
        firebaseService.getInventory(user.businessId),
      ]);
      setReportData({sales, inventory});
    } catch (e) {
      console.error('Failed to generate report:', e);
    }
  };

  const totalSales = reportData?.sales?.reduce((acc: number, s: any) => acc + s.totalValue, 0) || 0;
  const totalItems = reportData?.inventory?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0;
  const totalValue = reportData?.inventory?.reduce((acc: number, i: any) => acc + i.totalValue, 0) || 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('reports')}</Text>
      <Card>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={styles.statValue}>{formatRWF(totalSales)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Items</Text>
          <Text style={styles.statValue}>{totalItems}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Inventory Value</Text>
          <Text style={styles.statValue}>{formatRWF(totalValue)}</Text>
        </View>
      </Card>
      <Button title={t('generateReport')} onPress={generateReport} variant="primary" style={styles.button} />
      {reportData && (
        <Card title="Sales Breakdown" style={{marginTop: SPACING.md}}>
          {reportData.sales.slice(-10).map((s: any) => (
            <View key={s.id} style={styles.saleRow}>
              <Text style={styles.saleItemName}>{s.itemName}</Text>
              <Text style={styles.saleItemAmount}>{formatRWF(s.totalValue)}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  title: {fontSize: FONT_SIZES.xl, color: COLORS.cream, fontWeight: '700', marginBottom: SPACING.lg},
  sectionTitle: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', marginBottom: SPACING.md},
  statRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  statLabel: {color: COLORS.textSecondary, fontSize: FONT_SIZES.md},
  statValue: {color: COLORS.gold, fontSize: FONT_SIZES.md, fontWeight: '700'},
  button: {marginTop: SPACING.md},
  saleRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm},
  saleItemName: {color: COLORS.text},
  saleItemAmount: {color: COLORS.gold},
});
