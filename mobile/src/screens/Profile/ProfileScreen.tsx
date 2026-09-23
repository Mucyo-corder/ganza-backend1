import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {SPACING} from '../../constants/theme';
import {useAuth} from '../../hooks/useAuth';

const GANZA_ICON = (() => {
  try {return require('../../../assets/android-icon-foreground.png');} catch {return require('../../../assets/icon.png');}
})();

export default function ProfileScreen({navigation}: {navigation: {navigate: (s:string)=>void; goBack: ()=>void}}) {
  const {user} = useAuth();
  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => {}} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#60A5FA', '#3B82F6', '#1E40AF'] as unknown as string[]} style={styles.avatarGrad}>
              <Text style={styles.avatarText}>{(user?.email?.[0] || 'G').toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.avatarBadge}><View style={styles.avatarDot} /></View>
          </View>
          <Text style={styles.name}>{user?.email || 'GANZA Premium User'}</Text>
          <Text style={styles.role}>Business Owner • Premium • AI-enabled</Text>
          <View style={styles.pillRow}>
            <StatusPill status="success" label="Verified" />
            <View style={{width: 8}} />
            <StatusPill status="busy" label="Premium" />
          </View>
        </View>

        <GlassCard title="Business" subtitle="Ibyerekeye ubucuruzi" icon="⬢">
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Business ID</Text><Text style={styles.infoValue}>{user?.businessId?.slice(0,12) || '—'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{user?.email || '—'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Plan</Text><View style={styles.planPill}><Text style={styles.planText}>Premium Flagship</Text></View></View>
        </GlassCard>

        <GlassCard title="GANZA Icon" subtitle="Brand • Official logo inside app" icon="◈" style={{marginTop: 14}}>
          <View style={styles.logoShowcase}>
            <LinearGradient colors={['#EAF2FD', '#A9BFD3', '#7BA0C2'] as unknown as string[]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.logoShowcaseRim}>
              <View style={styles.logoShowcaseInner}>
                <Image source={GANZA_ICON} style={styles.logoImg} resizeMode="contain" />
              </View>
            </LinearGradient>
            <View style={styles.logoMeta}>
              <Text style={styles.logoTitle}>GANZA • Official Icon</Text>
              <Text style={styles.logoDesc}>Silver-blue metallic • Futuristic • Premium. Iyi icon niyo DNA y'interface yose.</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.statsRow}>
          <GlassCard style={styles.stat} padding="md"><Text style={styles.statValue}>128</Text><Text style={styles.statLabel}>Scans</Text></GlassCard>
          <GlassCard style={styles.stat} padding="md"><Text style={styles.statValue}>47</Text><Text style={styles.statLabel}>Sales</Text></GlassCard>
          <GlassCard style={styles.stat} padding="md"><Text style={styles.statValue}>3.2h</Text><Text style={styles.statLabel}>Saved</Text></GlassCard>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 12},
  profileHero: {alignItems: 'center', paddingVertical: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14},
  avatarWrap: {width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  avatarGrad: {width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)'},
  avatarText: {fontSize: 28, fontWeight: '900', color: '#fff'},
  avatarBadge: {position: 'absolute', bottom: 0, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#0A1930', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center'},
  avatarDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981'},
  name: {fontSize: 18, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.3},
  role: {fontSize: 12, color: '#8FA2BB', marginTop: 4},
  pillRow: {flexDirection: 'row', marginTop: 10},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  infoLabel: {fontSize: 11, fontWeight: '700', color: '#8FA2BB', letterSpacing: 0.5, textTransform: 'uppercase'},
  infoValue: {fontSize: 13, fontWeight: '600', color: '#EAF2FD'},
  planPill: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)'},
  planText: {fontSize: 11, fontWeight: '800', color: '#93C5FD'},
  logoShowcase: {flexDirection: 'row', alignItems: 'center'},
  logoShowcaseRim: {width: 64, height: 64, borderRadius: 18, padding: 1},
  logoShowcaseInner: {flex: 1, borderRadius: 17, backgroundColor: '#0A1930', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  logoImg: {width: 48, height: 48},
  logoMeta: {flex: 1, marginLeft: 14},
  logoTitle: {fontSize: 13, fontWeight: '800', color: '#F1F6FF', letterSpacing: 0.4},
  logoDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 4, lineHeight: 14},
  statsRow: {flexDirection: 'row', marginTop: 14},
  stat: {flex: 1, marginHorizontal: 4, alignItems: 'center'},
  statValue: {fontSize: 18, fontWeight: '900', color: '#F1F6FF'},
  statLabel: {fontSize: 10, fontWeight: '700', color: '#8FA2BB', marginTop: 4, letterSpacing: 0.6, textTransform: 'uppercase'},
});
