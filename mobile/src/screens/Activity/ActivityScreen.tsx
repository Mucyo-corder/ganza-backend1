import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {SPACING} from '../../constants/theme';

const ACTIVITIES = [
  {id: '1', title: 'Scan yakozwe neza', desc: '14 imbaho • 94% confidence • AI Vision', time: '10:42', type: 'scan', status: 'success' as const},
  {id: '2', title: 'Igurisha ryemejwe', desc: 'Uwacu Ltd • 12 imbaho • 180,000 RWF', time: '09:18', type: 'sale', status: 'success' as const},
  {id: '3', title: 'Sync hagati ya telephone & computer', desc: 'Auto-sync • 24 items • Cloud', time: '08:55', type: 'sync', status: 'busy' as const},
  {id: '4', title: 'Raporo yakozwe', desc: 'Weekly report • PDF • Shared', time: 'Yesterday 18:30', type: 'report', status: 'idle' as const},
  {id: '5', title: 'Umukiriya mushya', desc: 'Jean Bosco • 0788 123 456', time: 'Yesterday 16:12', type: 'customer', status: 'success' as const},
  {id: '6', title: 'Stock update', desc: 'Imbaho 3 zongerewe • Manual', time: 'Yesterday 14:00', type: 'inventory', status: 'idle' as const},
  {id: '7', title: 'Backup yakozwe', desc: 'Encrypted • Cloud • Daily', time: '2 days ago', type: 'system', status: 'success' as const},
];

const iconFor = (type: string) => {
  switch (type) {
    case 'scan': return '⬢';
    case 'sale': return '◆';
    case 'sync': return '⬡';
    case 'report': return '▭';
    case 'customer': return '◈';
    case 'inventory': return '⬢';
    default: return '⬣';
  }
};

export default function ActivityScreen({navigation}: {navigation: {navigate: (s: string) => void}}) {
  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ibikorwa</Text>
        <Text style={styles.subtitle}>System activity • Ibyakozwe na AI Agent n'abakoresha</Text>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statMini} padding="md">
            <Text style={styles.statMiniValue}>47</Text>
            <Text style={styles.statMiniLabel}>Ibikorwa uyu munsi</Text>
          </GlassCard>
          <GlassCard style={styles.statMini} padding="md">
            <Text style={[styles.statMiniValue, {color: '#60A5FA'}]}>98.4%</Text>
            <Text style={styles.statMiniLabel}>Automation</Text>
          </GlassCard>
          <GlassCard style={styles.statMini} padding="md">
            <Text style={[styles.statMiniValue, {color: '#10B981'}]}>12</Text>
            <Text style={styles.statMiniLabel}>Byakozwe na AI</Text>
          </GlassCard>
        </View>

        <GlassCard title="Timeline" subtitle="Ibyakozwe vuba" icon="◈">
          {ACTIVITIES.map((a, idx) => (
            <View key={a.id} style={styles.row}>
              <View style={styles.timeline}>
                <View style={[styles.dot, a.status === 'success' && styles.dotGreen, a.status === 'busy' && styles.dotBlue, a.status === 'idle' && styles.dotSteel]}>
                  <Text style={styles.dotIcon}>{iconFor(a.type)}</Text>
                </View>
                {idx !== ACTIVITIES.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={styles.itemTitle}>{a.title}</Text>
                  <Text style={styles.time}>{a.time}</Text>
                </View>
                <Text style={styles.desc}>{a.desc}</Text>
                <View style={styles.pillRow}>
                  <StatusPill status={a.status} label={a.status === 'success' ? 'Done' : a.status === 'busy' ? 'Syncing' : 'Info'} />
                  <Text style={styles.typeLabel}>{a.type}</Text>
                </View>
              </View>
            </View>
          ))}
        </GlassCard>

        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 12},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14},
  statsRow: {flexDirection: 'row', marginBottom: 14},
  statMini: {flex: 1, marginHorizontal: 4, alignItems: 'center'},
  statMiniValue: {fontSize: 18, fontWeight: '900', color: '#F1F6FF'},
  statMiniLabel: {fontSize: 10, fontWeight: '700', color: '#8FA2BB', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center'},
  row: {flexDirection: 'row', paddingVertical: 10},
  timeline: {width: 40, alignItems: 'center', marginRight: 8},
  dot: {width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1},
  dotGreen: {backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.18)'},
  dotBlue: {backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(96,165,250,0.18)'},
  dotSteel: {backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)'},
  dotIcon: {fontSize: 13, color: '#EAF2FD'},
  line: {flex: 1, width: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 6, marginBottom: -6},
  body: {flex: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  itemTitle: {fontSize: 13, fontWeight: '700', color: '#F1F6FF', flex: 1, marginRight: 8},
  time: {fontSize: 11, color: '#6B84A0', fontWeight: '500'},
  desc: {fontSize: 11, color: '#8FA2BB', marginTop: 3, lineHeight: 14},
  pillRow: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  typeLabel: {fontSize: 10, color: '#6B84A0', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600'},
});
