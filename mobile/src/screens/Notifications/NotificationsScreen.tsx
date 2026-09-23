import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {SPACING} from '../../constants/theme';

const NOTIFS = [
  {id: '1', title: 'Stock nke — Imbaho 3 gasigaye', desc: 'GANZA AI iragusaba kongera stock vuba.', time: '10 min ago', type: 'warning', icon: '⬢'},
  {id: '2', title: 'Igurisha ryemejwe', desc: 'Jean Bosco • 12 imbaho • 180,000 RWF — Byahujwe to computer.', time: '1h ago', type: 'success', icon: '◆'},
  {id: '3', title: 'Sync yakozwe neza', desc: 'Telephone ↔ Computer • 24 items • Cloud backup done.', time: '3h ago', type: 'info', icon: '⬡'},
  {id: '4', title: 'Raporo y’ukwezi yiteguye', desc: 'PDF • 2.4 MB • AI insight included.', time: 'Yesterday', type: 'info', icon: '▭'},
  {id: '5', title: 'Igikoresho gishya kihujwe', desc: 'iPad • Safari • Byahujwe via QR.', time: '2 days ago', type: 'success', icon: '◈'},
];

export default function NotificationsScreen({navigation}: {navigation: {goBack: () => void; navigate: (s:string)=>void}}) {
  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => {}} onProfilePress={() => navigation.navigate('Profile')} notificationCount={3} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Ibyo GANZA ikumenyesha • AI + system</Text>
          </View>
          <TouchableOpacity style={styles.markBtn} activeOpacity={0.85}><Text style={styles.markText}>Mark all read</Text></TouchableOpacity>
        </View>

        {NOTIFS.map(n => (
          <GlassCard key={n.id} style={styles.card} padding="md" variant={n.type === 'warning' ? 'accent' : 'default'}>
            <View style={styles.row}>
              <View style={[styles.iconBox, n.type === 'warning' && styles.iconWarn, n.type === 'success' && styles.iconSuccess]}><Text style={styles.icon}>{n.icon}</Text></View>
              <View style={{flex: 1}}>
                <View style={styles.topRow}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <View style={styles.dot} />
                </View>
                <Text style={styles.desc}>{n.desc}</Text>
                <View style={styles.bottomRow}>
                  <Text style={styles.time}>{n.time}</Text>
                  <StatusPill status={n.type === 'warning' ? 'warning' : n.type === 'success' ? 'success' : 'idle'} label={n.type} />
                </View>
              </View>
            </View>
          </GlassCard>
        ))}

        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 12},
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4},
  markBtn: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  markText: {fontSize: 11, fontWeight: '700', color: '#93C5FD'},
  card: {marginBottom: 10},
  row: {flexDirection: 'row'},
  iconBox: {width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  iconWarn: {backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.18)'},
  iconSuccess: {backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.16)'},
  icon: {fontSize: 15, color: '#EAF2FD'},
  topRow: {flexDirection: 'row', alignItems: 'center'},
  notifTitle: {fontSize: 13, fontWeight: '700', color: '#F1F6FF', flex: 1},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#60A5FA', marginLeft: 8},
  desc: {fontSize: 11, color: '#8FA2BB', marginTop: 4, lineHeight: 14},
  bottomRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8},
  time: {fontSize: 11, color: '#6B84A0'},
});
