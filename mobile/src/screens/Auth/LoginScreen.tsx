import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ScrollView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {SPACING} from '../../constants/theme';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {PremiumInput} from '../../components/premium/PremiumInput';
import {AmbientBackground} from '../../components/premium/AmbientBackground';

const GANZA_ICON = (() => {
  try {return require('../../../assets/android-icon-foreground.png');} catch {return require('../../../assets/icon.png');}
})();

export default function LoginScreen({navigation}: any) {
  const {signIn, error, loading} = useAuth();
  const {t} = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {await signIn(email, password);} catch {}
  };

  return (
    <AmbientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Premium brand hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['#EAF2FD', '#A9BFD3', '#7BA0C2', '#D8E6F5'] as unknown as string[]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.logoRim}>
              <View style={styles.logoInner}>
                <Image source={GANZA_ICON} style={styles.logoImg} resizeMode="contain" />
                <LinearGradient colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.00)'] as unknown as string[]} start={{x:0.5,y:0}} end={{x:0.5,y:0.5}} style={styles.logoSheen} />
              </View>
            </LinearGradient>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.ganza}>GANZA</Text>
          <View style={styles.premiumPill}><Text style={styles.premiumPillText}>PREMIUM • WOOD INVENTORY</Text></View>
          <Text style={styles.tagline}>Manage your wood stock easily.</Text>
          <Text style={styles.taglineSub}>Calm • Premium • Simple • Kinyarwanda-first</Text>
        </View>

        <View style={styles.form}>
          <LinearGradient colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)'] as unknown as string[]} style={styles.formGlow} />
          <View style={styles.formHighlight} />
          <Text style={styles.formTitle}>Kwinjira</Text>
          <Text style={styles.formSub}>Injira muri GANZA — wood inventory & calculation</Text>

          <PremiumInput value={email} onChangeText={setEmail} placeholder="email@ganza.rw" label={t('email')} icon="◈" />
          <PremiumInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry label={t('password')} icon="⬣" />

          <PremiumButton title={t('login')} onPress={handleLogin} size="lg" loading={loading} style={styles.loginButton} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>cyangwa</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow} activeOpacity={0.85}>
            <Text style={styles.linkHint}>Nta konti ufite? </Text>
            <Text style={styles.linkText}>{t('register')} →</Text>
          </TouchableOpacity>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <View style={styles.trustRow}>
            <View style={styles.trustPill}><View style={styles.trustDot} /><Text style={styles.trustText}>Encrypted</Text></View>
            <View style={styles.trustPill}><View style={[styles.trustDot, {backgroundColor: '#60A5FA'}]} /><Text style={styles.trustText}>Premium</Text></View>
          </View>
        </View>

        <Text style={styles.footer}>GANZA • Silver-blue metallic • Futuristic luxury</Text>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: SPACING.lg, paddingTop: 60, paddingBottom: 40},
  hero: {alignItems: 'center', marginBottom: 24},
  logoWrap: {width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 14},
  logoRim: {width: 76, height: 76, borderRadius: 22, padding: 1.2, shadowColor: '#60A5FA', shadowOpacity: 0.3, shadowRadius: 16, elevation: 8},
  logoInner: {flex: 1, borderRadius: 21, backgroundColor: '#0A1930', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  logoImg: {width: 56, height: 56},
  logoSheen: {position: 'absolute', top: 0, left: 0, right: 0, height: 28},
  logoGlow: {position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(59,130,246,0.10)', top: -8, left: -8, zIndex: -1},
  ganza: {fontSize: 32, fontWeight: '900', letterSpacing: 4, color: '#F1F6FF', textShadowColor: 'rgba(96,165,250,0.35)', textShadowRadius: 14},
  premiumPill: {marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)'},
  premiumPillText: {fontSize: 9, fontWeight: '800', letterSpacing: 1.4, color: '#93C5FD'},
  tagline: {fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: '#CBD8E6', marginTop: 8},
  taglineSub: {fontSize: 11, color: '#8FA2BB', marginTop: 4, textAlign: 'center'},
  form: {borderRadius: 24, padding: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative'},
  formGlow: {position: 'absolute', top: -40, left: -40, right: -40, height: 120, opacity: 0.6},
  formHighlight: {position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.10)'},
  formTitle: {fontSize: 18, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.3},
  formSub: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 16},
  loginButton: {marginTop: 8},
  dividerRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 16},
  divider: {flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)'},
  dividerText: {fontSize: 11, color: '#6B84A0', marginHorizontal: 12, fontWeight: '600'},
  linkRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8},
  linkHint: {fontSize: 13, color: '#8FA2BB'},
  linkText: {fontSize: 13, fontWeight: '800', color: '#93C5FD'},
  errorBox: {marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.16)'},
  errorText: {color: '#FCA5A5', textAlign: 'center', fontSize: 12, fontWeight: '600'},
  trustRow: {flexDirection: 'row', justifyContent: 'center', marginTop: 16},
  trustPill: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginHorizontal: 4},
  trustDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6},
  trustText: {fontSize: 10, fontWeight: '700', color: '#8FA2BB', letterSpacing: 0.4, textTransform: 'uppercase'},
  footer: {fontSize: 10, color: '#5E728C', textAlign: 'center', marginTop: 20, letterSpacing: 0.4},
});
