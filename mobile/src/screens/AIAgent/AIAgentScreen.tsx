import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {SPACING} from '../../constants/theme';

export default function AIAgentScreen({navigation}: {navigation: {navigate: (s: string) => void; goBack: () => void}}) {
  const [mode, setMode] = useState<'auto' | 'assist' | 'manual'>('auto');

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero agent state */}
        <View style={styles.hero}>
          <LinearGradient colors={['rgba(59,130,246,0.18)', 'rgba(56,189,248,0.08)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={styles.heroGlow} />
          <View style={styles.heroIconWrap}>
            <LinearGradient colors={['#60A5FA', '#3B82F6', '#1E40AF'] as unknown as string[]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.heroIconGradient}>
              <Text style={styles.heroIcon}>✦</Text>
            </LinearGradient>
            <View style={styles.heroPulse} />
            <View style={styles.heroPulse2} />
          </View>
          <Text style={styles.heroTitle}>GANZA AI Agent</Text>
          <Text style={styles.heroSub}>Autonomous • Intelligent • Trusted</Text>
          <View style={styles.heroPills}>
            <StatusPill status="active" label="Operational" />
            <View style={{width: 8}} />
            <StatusPill status="busy" label="Learning" />
          </View>
        </View>

        {/* Mode selector — premium segmented */}
        <GlassCard title="Uburyo bwo gukora" subtitle="Hitamo uburyo Agent ikora" icon="⬡">
          <View style={styles.segment}>
            {(['auto', 'assist', 'manual'] as const).map(m => (
              <TouchableOpacity key={m} style={[styles.segmentItem, mode === m && styles.segmentActive]} onPress={() => setMode(m)} activeOpacity={0.85}>
                {mode === m && <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={StyleSheet.absoluteFill} />}
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>{m === 'auto' ? 'Auto' : m === 'assist' ? 'Assist' : 'Manual'}</Text>
                <Text style={[styles.segmentSub, mode === m && styles.segmentSubActive]}>{m === 'auto' ? 'Ikora yonyine' : m === 'assist' ? 'Ikuobor' : 'Wowe ubikora'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.modeDesc}>
            {mode === 'auto' ? 'Agent izafata ibyemezo, igakora imirimo, ikanakumenyesha gusa igihe bikenewe. Ibyiza ku bantu bashaka umuvuduko.' : mode === 'assist' ? 'Agent iragufasha, ikakubaza mbere yo gukora. Ibyiza ku kugenzura neza.' : 'Wowe ubikoraho byose — Agent itanga inama gusa.'}
          </Text>
        </GlassCard>

        {/* Capabilities */}
        <GlassCard title="Ubushobozi" subtitle="Ibyo GANZA ishobora gukora wenyine" icon="◈" style={{marginTop: 14}}>
          {[
            {icon: '⬢', title: 'Kubara imbaho na AI Vision', desc: '94.2% accuracy • Fata ifoto, ibara automatically', state: 'active'},
            {icon: '◆', title: 'Gucunga ububiko', desc: 'Auto-add, update, low-stock alerts', state: 'active'},
            {icon: '▭', title: 'Gukora raporo', desc: 'Daily / weekly / monthly — automatic PDF', state: 'active'},
            {icon: '◈', title: 'Kumenyesha abakiriya', desc: 'SMS / WhatsApp — kubishyuza, kwibutsa', state: 'queued'},
            {icon: '⬡', title: 'Sync telephone ↔ computer', desc: 'Real-time, encrypted, offline-first', state: 'active'},
          ].map((cap, idx) => (
            <View key={idx} style={styles.capRow}>
              <View style={[styles.capIconBox, cap.state === 'active' && styles.capIconActive]}><Text style={styles.capIcon}>{cap.icon}</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.capTitle}>{cap.title}</Text>
                <Text style={styles.capDesc}>{cap.desc}</Text>
              </View>
              <View style={[styles.toggle, cap.state === 'active' && styles.toggleActive]}><View style={[styles.toggleDot, cap.state === 'active' && styles.toggleDotActive]} /></View>
            </View>
          ))}
        </GlassCard>

        {/* Intelligence metrics */}
        <View style={styles.metricsGrid}>
          <GlassCard style={styles.metricCard} padding="md">
            <Text style={styles.metricLabel}>Precision</Text>
            <Text style={styles.metricValue}>98.4%</Text>
            <View style={styles.miniTrack}><View style={[styles.miniFill, {width: '98%', backgroundColor: '#10B981'}]} /></View>
          </GlassCard>
          <GlassCard style={styles.metricCard} padding="md">
            <Text style={styles.metricLabel}>Tasks / day</Text>
            <Text style={styles.metricValue}>47</Text>
            <View style={styles.miniTrack}><View style={[styles.miniFill, {width: '72%'}]} /></View>
          </GlassCard>
          <GlassCard style={styles.metricCard} padding="md">
            <Text style={styles.metricLabel}>Time saved</Text>
            <Text style={styles.metricValue}>3.2h</Text>
            <View style={styles.miniTrack}><View style={[styles.miniFill, {width: '64%', backgroundColor: '#38BDF8'}]} /></View>
          </GlassCard>
        </View>

        {/* Trust */}
        <GlassCard variant="luminous" style={{marginTop: 14}} padding="md">
          <View style={styles.trustRow}>
            <Text style={styles.trustIcon}>⬣</Text>
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.trustTitle}>Yizewe • Encrypted • Private</Text>
              <Text style={styles.trustDesc}>Amakuru yawe abikwa neza. AI ikora kuri device yawe mbere yo kujya kuri cloud. Nta data igurishwa.</Text>
            </View>
          </View>
        </GlassCard>

        <PremiumButton title="Vugana na GANZA AI" onPress={() => {}} size="lg" style={{marginTop: 16}} icon="✦" />
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Reba ibisobanuro byimbitse →</Text>
        </TouchableOpacity>

        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 8},
  hero: {alignItems: 'center', paddingVertical: 18, position: 'relative', overflow: 'hidden', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14},
  heroGlow: {position: 'absolute', top: -60, left: -60, right: -60, height: 200, borderRadius: 100, opacity: 0.6},
  heroIconWrap: {width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative'},
  heroIconGradient: {width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', shadowColor: '#3B82F6', shadowOpacity: 0.35, shadowRadius: 16, elevation: 8},
  heroIcon: {fontSize: 26, color: '#fff', fontWeight: '700'},
  heroPulse: {position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)'},
  heroPulse2: {position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.08)'},
  heroTitle: {fontSize: 20, fontWeight: '900', color: '#F1F6FF', letterSpacing: 1.2},
  heroSub: {fontSize: 11, color: '#8FA2BB', marginTop: 4, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '600'},
  heroPills: {flexDirection: 'row', marginTop: 12},
  segment: {flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'},
  segmentItem: {flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', overflow: 'hidden', position: 'relative', marginHorizontal: 2},
  segmentActive: {shadowColor: '#3B82F6', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4},
  segmentText: {fontSize: 13, fontWeight: '700', color: '#8FA2BB'},
  segmentTextActive: {color: '#fff'},
  segmentSub: {fontSize: 10, color: '#6B84A0', marginTop: 2},
  segmentSubActive: {color: 'rgba(255,255,255,0.75)'},
  modeDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 10, lineHeight: 15},
  capRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  capIconBox: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  capIconActive: {backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(96,165,250,0.18)'},
  capIcon: {fontSize: 12, color: '#93C5FD'},
  capTitle: {fontSize: 12, fontWeight: '700', color: '#EAF2FD'},
  capDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  toggle: {width: 38, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 2, justifyContent: 'center'},
  toggleActive: {backgroundColor: 'rgba(59,130,246,0.22)', borderColor: 'rgba(96,165,250,0.22)'},
  toggleDot: {width: 16, height: 16, borderRadius: 8, backgroundColor: '#6B84A0'},
  toggleDotActive: {backgroundColor: '#60A5FA', alignSelf: 'flex-end', shadowColor: '#60A5FA', shadowOpacity: 0.5, shadowRadius: 6},
  metricsGrid: {flexDirection: 'row', marginTop: 14},
  metricCard: {flex: 1, marginHorizontal: 4, alignItems: 'center'},
  metricLabel: {fontSize: 10, fontWeight: '700', color: '#8FA2BB', letterSpacing: 0.6, textTransform: 'uppercase'},
  metricValue: {fontSize: 18, fontWeight: '900', color: '#F1F6FF', marginTop: 6},
  miniTrack: {height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 8, width: '100%', overflow: 'hidden'},
  miniFill: {height: '100%', backgroundColor: '#60A5FA', borderRadius: 3},
  trustRow: {flexDirection: 'row', alignItems: 'flex-start'},
  trustIcon: {fontSize: 18, color: '#93C5FD', marginTop: 2},
  trustTitle: {fontSize: 12, fontWeight: '800', color: '#EAF2FD', letterSpacing: 0.4},
  trustDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 4, lineHeight: 14},
  secondaryBtn: {marginTop: 12, alignItems: 'center', padding: 12},
  secondaryBtnText: {fontSize: 13, fontWeight: '700', color: '#93C5FD'},
});
