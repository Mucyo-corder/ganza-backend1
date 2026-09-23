import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {SPACING} from '../../constants/theme';

export default function DevicesScreen({navigation}: {navigation: {navigate: (s: string) => void}}) {
  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ibikoresho</Text>
        <Text style={styles.subtitle}>Telekone • Computer • Cloud — bihujwe na GANZA AI</Text>

        {/* Connected devices */}
        <GlassCard variant="luminous" padding="lg" style={{marginBottom: 14}}>
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>Connected</Text>
            <StatusPill status="success" label="3 online" />
          </View>

          <View style={styles.deviceGrid}>
            <View style={[styles.deviceCard, styles.deviceCardActive]}>
              <LinearGradient colors={['rgba(59,130,246,0.14)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={StyleSheet.absoluteFill} />
              <View style={styles.deviceIconWrap}><Text style={styles.deviceIcon}>◈</Text></View>
              <Text style={styles.deviceName}>Telephone</Text>
              <Text style={styles.deviceModel}>Android • GANZA</Text>
              <View style={styles.deviceStatusRow}><View style={styles.dotGreen} /><Text style={styles.deviceStatusText}>Connected • Active</Text></View>
              <View style={styles.signalRow}>
                <View style={[styles.signalBar, {height: 10, backgroundColor: '#60A5FA'}]} />
                <View style={[styles.signalBar, {height: 14, backgroundColor: '#60A5FA'}]} />
                <View style={[styles.signalBar, {height: 18, backgroundColor: '#60A5FA'}]} />
                <View style={[styles.signalBar, {height: 14, backgroundColor: 'rgba(255,255,255,0.12)'}]} />
              </View>
            </View>

            <View style={[styles.deviceCard, styles.deviceCardActive]}>
              <LinearGradient colors={['rgba(56,189,248,0.10)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={StyleSheet.absoluteFill} />
              <View style={styles.deviceIconWrap}><Text style={styles.deviceIcon}>⬡</Text></View>
              <Text style={styles.deviceName}>Computer</Text>
              <Text style={styles.deviceModel}>Windows • Byahujwe</Text>
              <View style={styles.deviceStatusRow}><View style={styles.dotGreen} /><Text style={styles.deviceStatusText}>Byahujwe • 2s ago</Text></View>
              <View style={styles.signalRow}>
                <View style={[styles.signalBar, {height: 10, backgroundColor: '#38BDF8'}]} />
                <View style={[styles.signalBar, {height: 14, backgroundColor: '#38BDF8'}]} />
                <View style={[styles.signalBar, {height: 18, backgroundColor: '#38BDF8'}]} />
                <View style={[styles.signalBar, {height: 18, backgroundColor: '#38BDF8'}]} />
              </View>
            </View>
          </View>

          <View style={[styles.deviceCard, styles.deviceCardWide]}>
            <View style={styles.deviceWideLeft}>
              <View style={styles.deviceIconWrapSmall}><Text style={styles.deviceIconSmall}>⬢</Text></View>
              <View>
                <Text style={styles.deviceNameSmall}>Cloud Sync</Text>
                <Text style={styles.deviceModelSmall}>Firebase • Encrypted • Africa</Text>
              </View>
            </View>
            <StatusPill status="busy" label="Syncing" />
          </View>
        </GlassCard>

        {/* Device capabilities */}
        <GlassCard title="Uburyo bikora" subtitle="Cross-device automation" icon="✦">
          <View style={styles.capRow}>
            <View style={styles.capIconBox}><Text style={styles.capIcon}>⬢</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.capTitle}>Fata ifoto kuri telephone →  Tangira kuri computer auto</Text>
              <Text style={styles.capDesc}>Scan imbaho, AI ibara, ububiko buvugururwa ahantu hose.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.capRow}>
            <View style={styles.capIconBox}><Text style={styles.capIcon}>◆</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.capTitle}>Gurisha kuri telephone, raporo kuri computer</Text>
              <Text style={styles.capDesc}>Real-time sync — nta manual transfer.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.capRow}>
            <View style={styles.capIconBox}><Text style={styles.capIcon}>▭</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.capTitle}>AI ikora kuri device zombi</Text>
              <Text style={styles.capDesc}>Precision 98.4% • On-device + cloud intelligence.</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard title="Ibikoresho bindi" subtitle="Add device" icon="⬡" style={{marginTop: 14}}>
          <TouchableOpacity style={styles.addDevice} activeOpacity={0.85}>
            <View style={styles.addDeviceIconBox}><Text style={styles.addDeviceIcon}>＋</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.addDeviceTitle}>Huza igikoresho gishya</Text>
              <Text style={styles.addDeviceSub}>Scan QR kuri computer cyangwa tablette</Text>
            </View>
            <Text style={styles.addDeviceArrow}>→</Text>
          </TouchableOpacity>
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
  devicesHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
  devicesTitle: {fontSize: 12, fontWeight: '800', color: '#EAF2FD', letterSpacing: 0.6, textTransform: 'uppercase'},
  deviceGrid: {flexDirection: 'row', marginBottom: 10},
  deviceCard: {flex: 1, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 4, overflow: 'hidden', position: 'relative'},
  deviceCardActive: {borderColor: 'rgba(96,165,250,0.16)', backgroundColor: 'rgba(255,255,255,0.06)'},
  deviceCardWide: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4},
  deviceIconWrap: {width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 10},
  deviceIcon: {fontSize: 16, color: '#CBD8E6'},
  deviceName: {fontSize: 14, fontWeight: '800', color: '#F1F6FF'},
  deviceModel: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  deviceStatusRow: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  dotGreen: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6},
  deviceStatusText: {fontSize: 11, fontWeight: '600', color: '#6EE7B7'},
  signalRow: {flexDirection: 'row', alignItems: 'flex-end', marginTop: 10, height: 20},
  signalBar: {width: 4, borderRadius: 2, marginRight: 3, backgroundColor: '#60A5FA'},
  deviceWideLeft: {flexDirection: 'row', alignItems: 'center'},
  deviceIconWrapSmall: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  deviceIconSmall: {fontSize: 13, color: '#CBD8E6'},
  deviceNameSmall: {fontSize: 13, fontWeight: '700', color: '#F1F6FF'},
  deviceModelSmall: {fontSize: 11, color: '#8FA2BB', marginTop: 1},
  capRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6},
  capIconBox: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  capIcon: {fontSize: 13, color: '#93C5FD'},
  capTitle: {fontSize: 12, fontWeight: '700', color: '#EAF2FD', lineHeight: 16},
  capDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 2, lineHeight: 14},
  divider: {height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10},
  addDevice: {flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed'},
  addDeviceIconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  addDeviceIcon: {fontSize: 16, color: '#93C5FD', fontWeight: '700'},
  addDeviceTitle: {fontSize: 13, fontWeight: '700', color: '#EAF2FD'},
  addDeviceSub: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  addDeviceArrow: {fontSize: 16, color: '#60A5FA', marginLeft: 8, fontWeight: '700'},
});
