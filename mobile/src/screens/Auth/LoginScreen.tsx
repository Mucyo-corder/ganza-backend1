import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ScrollView} from 'react-native';
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
            <View style={styles.logoRim}>
              <View style={styles.logoInner}>
                <Image source={GANZA_ICON} style={styles.logoImg} resizeMode="contain" />
              </View>
            </View>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.ganza}>GANZA</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formHighlight} />
          <Text style={styles.formTitle}>Login</Text>

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

        </View>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: SPACING.lg, paddingTop: 60, paddingBottom: 40},
  hero: {alignItems: 'center', marginBottom: 24},
  logoWrap: {width: 84, height: 84, justifyContent: 'center', alignItems: 'center', marginBottom: 14},
  logoRim: {width: 76, height: 76, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: '#FFFFFF'},
  logoInner: {flex: 1, borderRadius: 4, backgroundColor: '#202020', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  logoImg: {width: 56, height: 56},
  logoGlow: {position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)', top: -8, left: -8, zIndex: -1},
  ganza: {fontSize: 32, fontWeight: '900', letterSpacing: 4, color: '#F1F6FF'},
  form: {borderRadius: 24, padding: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative'},
  formHighlight: {position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.10)'},
  formTitle: {fontSize: 18, fontWeight: '900', color: '#F5F7FA', letterSpacing: -0.3},
  loginButton: {marginTop: 8},
  dividerRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 16},
  divider: {flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)'},
  dividerText: {fontSize: 11, color: '#6B84A0', marginHorizontal: 12, fontWeight: '600'},
  linkRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8},
  linkHint: {fontSize: 13, color: '#8FA2BB'},
  linkText: {fontSize: 13, fontWeight: '800', color: '#93C5FD'},
  errorBox: {marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.16)'},
  errorText: {color: '#FCA5A5', textAlign: 'center', fontSize: 12, fontWeight: '600'},
});
