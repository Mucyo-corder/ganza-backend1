import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {SaleItem} from '../../types';
import {Card} from '../../components/common/Card';

interface Props {
  route: {params: {sale: SaleItem}};
  navigation: any;
}

export default function SaleDetailScreen({route, navigation}: Props) {
  const {sale} = route.params;

  return (
    <ScrollView style={styles.container}>
      <Card title="Sale Details">
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{sale.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Item:</Text>
          <Text style={styles.value}>{sale.itemName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{sale.quantity}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Unit Price:</Text>
          <Text style={styles.value}>{formatRWF(sale.unitPrice)}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.label, styles.totalLabel]}>Total:</Text>
          <Text style={[styles.value, styles.totalValue]}>{formatRWF(sale.totalValue)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{sale.status}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  label: {color: COLORS.textSecondary, fontSize: FONT_SIZES.md},
  value: {color: COLORS.text, fontSize: FONT_SIZES.md},
  totalRow: {borderBottomWidth: 0},
  totalLabel: {fontWeight: '700', fontSize: FONT_SIZES.lg},
  totalValue: {fontWeight: '800', color: COLORS.gold, fontSize: FONT_SIZES.lg},
});
