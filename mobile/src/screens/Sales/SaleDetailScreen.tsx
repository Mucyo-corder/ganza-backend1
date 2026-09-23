import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {formatRWF} from '../../utils/formatters';
import {SPACING} from '../../constants/theme';
import {SaleItem} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';

interface Props {route: {params: {sale: SaleItem}}; navigation: any;}

export default function SaleDetailScreen({route}: Props) {
  const {sale} = route.params;
  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" />
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sale Details</Text>
        <Text style={styles.subtitle}>GANZA • Premium transaction</Text>
        <GlassCard title="Transaction" subtitle={`${new Date(sale.createdAt).toLocaleString('rw-RW')}`} icon="◆" variant="luminous">
          <View style={styles.row}><Text style={styles.label}>Umukiriya</Text><Text style={styles.value}>{sale.customerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Igicuruzwa</Text><Text style={styles.value}>{sale.itemName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Umubare</Text><Text style={styles.value}>{sale.quantity} imbaho</Text></View>
          <View style={styles.row}><Text style={styles.label}>Igiciro /pc</Text><Text style={styles.value}>{formatRWF(sale.unitPrice)}</Text></View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={[styles.label, styles.totalLabel]}>Total</Text>
            <Text style={[styles.value, styles.totalValue]}>{formatRWF(sale.totalValue)}</Text>
          </View>
          <View style={styles.row}><Text style={styles.label}>Status</Text><StatusPill status={sale.status === 'confirmed' ? 'success' : 'idle'} label={sale.status} /></View>
          <View style={styles.row}><Text style={styles.label}>Payment</Text><Text style={styles.value}>{(sale as any).paymentMethod || 'cash'}</Text></View>
        </GlassCard>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
  title: {fontSize: 22, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.4},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  label: {color: '#8FA2BB', fontSize: 12, fontWeight: '600'},
  value: {color: '#F1F6FF', fontSize: 13, fontWeight: '600'},
  totalRow: {borderBottomWidth: 0, backgroundColor: 'rgba(59,130,246,0.08)', marginHorizontal: -4, paddingHorizontal: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)'},
  totalLabel: {fontWeight: '800', fontSize: 13, color: '#EAF2FD'},
  totalValue: {fontWeight: '900', color: '#60A5FA', fontSize: 16},
});
