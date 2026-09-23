import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch} from 'react-native';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {SPACING} from '../../constants/theme';
import {useLocalization} from '../../localization/LocalizationContext';
import {useAuth} from '../../hooks/useAuth';

export default function SettingsScreen({navigation}: {navigation: {navigate: (s: string) => void}}) {
  const {t, language, setLanguage} = useLocalization();
  const {user, signOut} = useAuth();
  const [notif, setNotif] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [aiAuto, setAiAuto] = useState(true);

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Igenamiterere</Text>
        <Text style={styles.subtitle}>Settings • GANZA Premium</Text>

        <GlassCard title="GANZA Agent" subtitle="AI autonomous settings" icon="✦" variant="luminous" style={{marginBottom: 14}}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}><Text style={styles.icon}>✦</Text></View>
              <View>
                <Text style={styles.rowTitle}>Auto-pilot</Text>
                <Text style={styles.rowSub}>AI ikora yonyine nta kubaza</Text>
              </View>
            </View>
            <Switch value={aiAuto} onValueChange={setAiAuto} trackColor={{false: '#1F2937', true: '#3B82F6'}} thumbColor="#fff" />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}><Text style={styles.icon}>⬡</Text></View>
              <View>
                <Text style={styles.rowTitle}>Auto-sync</Text>
                <Text style={styles.rowSub}>Telephone ↔ Computer • Real-time</Text>
              </View>
            </View>
            <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{false: '#1F2937', true: '#3B82F6'}} thumbColor="#fff" />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}><Text style={styles.icon}>◈</Text></View>
              <View>
                <Text style={styles.rowTitle}>Notifications</Text>
                <Text style={styles.rowSub}>Kumenyesha igihe AI irangije</Text>
              </View>
            </View>
            <Switch value={notif} onValueChange={setNotif} trackColor={{false: '#1F2937', true: '#3B82F6'}} thumbColor="#fff" />
          </View>
        </GlassCard>

        <GlassCard title="Ururimi" subtitle="Language • Kinyarwanda-first" icon="⬣">
          <View style={styles.langRow}>
            {(['kin', 'en', 'fr'] as const).map(l => (
              <TouchableOpacity key={l} style={[styles.langChip, language === l && styles.langChipActive]} onPress={() => setLanguage(l)} activeOpacity={0.85}>
                <Text style={[styles.langText, language === l && styles.langTextActive]}>{l === 'kin' ? 'Kinyarwanda' : l === 'en' ? 'English' : 'Français'}</Text>
                {language === l && <View style={styles.langDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard title="Ibikoresho" subtitle="Devices & sync" icon="⬢" style={{marginTop: 14}}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Devices')} activeOpacity={0.85}>
            <View style={styles.menuLeft}><View style={styles.menuIconBox}><Text style={styles.menuIcon}>⬢</Text></View><Text style={styles.menuText}>Ibikoresho bihujwe</Text></View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AIAgent')} activeOpacity={0.85}>
            <View style={styles.menuLeft}><View style={styles.menuIconBox}><Text style={styles.menuIcon}>✦</Text></View><Text style={styles.menuText}>AI Agent</Text></View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Activity')} activeOpacity={0.85}>
            <View style={styles.menuLeft}><View style={styles.menuIconBox}><Text style={styles.menuIcon}>◈</Text></View><Text style={styles.menuText}>Ibikorwa</Text></View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.85}>
            <View style={styles.menuLeft}><View style={styles.menuIconBox}><Text style={styles.menuIcon}>⬣</Text></View><Text style={styles.menuText}>Notifications</Text></View>
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>3</Text></View>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard title="Konte" subtitle={user?.email || 'GANZA user'} icon="◈" style={{marginTop: 14}}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
            <View style={styles.menuLeft}><View style={styles.menuIconBox}><Text style={styles.menuIcon}>◈</Text></View><Text style={styles.menuText}>Umwirondoro</Text></View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()} activeOpacity={0.85}>
            <Text style={styles.logoutText}>Sohoka • Logout</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>GANZA Premium • v1.0 • Flagship AI</Text>
          <Text style={styles.footerSub}>Yakozwe mu Rwanda • Kinyarwanda-first</Text>
        </View>

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
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6},
  rowLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  iconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  icon: {fontSize: 13, color: '#93C5FD'},
  rowTitle: {fontSize: 13, fontWeight: '700', color: '#F1F6FF'},
  rowSub: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  divider: {height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8},
  langRow: {flexDirection: 'row'},
  langChip: {flex: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginRight: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center'},
  langChipActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.22)'},
  langText: {fontSize: 12, fontWeight: '700', color: '#8FA2BB'},
  langTextActive: {color: '#EAF2FD'},
  langDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA', marginLeft: 6},
  menuItem: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  menuLeft: {flexDirection: 'row', alignItems: 'center'},
  menuIconBox: {width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  menuIcon: {fontSize: 12, color: '#CBD8E6'},
  menuText: {fontSize: 13, fontWeight: '600', color: '#EAF2FD'},
  menuArrow: {fontSize: 14, color: '#6B84A0', fontWeight: '700'},
  notifBadge: {minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6},
  notifBadgeText: {fontSize: 11, fontWeight: '800', color: '#fff'},
  logoutBtn: {marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.16)', alignItems: 'center'},
  logoutText: {fontSize: 13, fontWeight: '800', color: '#FCA5A5', letterSpacing: 0.4, textTransform: 'uppercase'},
  footer: {alignItems: 'center', marginTop: 20},
  footerText: {fontSize: 11, color: '#6B84A0', fontWeight: '600', letterSpacing: 0.4},
  footerSub: {fontSize: 10, color: '#5E728C', marginTop: 4},
});
