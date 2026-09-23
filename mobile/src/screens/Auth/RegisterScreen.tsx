import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView} from 'react-native';
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

export default function RegisterScreen({navigation}: any) {
  const {signUp, error, loading} = useAuth();
  const {t} = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert(t('error') + ': Passwords do not match');
      return;
    }
    try {await signUp(email, password, displayName);} catch {}
  };

  return (
    <AmbientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['#EAF2FD', '#A9BFD3', '#7BA0C2'] as unknown as string[]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.logoRim}>
              <View style={styles.logoInner}>
                <Image source={GANZA_ICON} style={styles.logoImg} resizeMode="contain" />
              </View>
            </LinearGradient>
          </View>
          <Text style={styles.ganza}>GANZA</Text>
          <Text style={styles.tagline}>Wood inventory • Calm & premium</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formHighlight} />
          <Text style={styles.formTitle}>Gufungura konti</Text>
          <Text style={styles.formSub}>Tangira na GANZA — wood stock management</Text>

          <PremiumInput value={displayName} onChangeText={setDisplayName} placeholder="Amazina yose" label={t('fullName')} icon="◈" />
          <PremiumInput value={email} onChangeText={setEmail} placeholder="email@ganza.rw" label={t('email')} icon="⬡" />
          <PremiumInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry label={t('password')} icon="⬣" />
          <PremiumInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry label={t('confirmPassword')} icon="⬣" />

          <PremiumButton title={t('register')} onPress={handleRegister} size="lg" loading={loading} style={styles.registerButton} icon="✦" />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkRow} activeOpacity={0.85}>
            <Text style={styles.linkHint}>Usanzwe ufite konti? </Text>
            <Text style={styles.linkText}>{t('login')} →</Text>
          </TouchableOpacity>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        </View>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: SPACING.lg, paddingTop: 40, paddingBottom: 40},
  hero: {alignItems: 'center', marginBottom: 20},
  logoWrap: {width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 10},
  logoRim: {width: 60, height: 60, borderRadius: 18, padding: 1},
  logoInner: {flex: 1, borderRadius: 17, backgroundColor: '#0A1930', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  logoImg: {width: 42, height: 42},
  ganza: {fontSize: 26, fontWeight: '900', letterSpacing: 3, color: '#F1F6FF'},
  tagline: {fontSize: 12, fontWeight: '700', color: '#8FA2BB', marginTop: 4, letterSpacing: 0.6},
  form: {borderRadius: 24, padding: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative'},
  formHighlight: {position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.10)'},
  formTitle: {fontSize: 18, fontWeight: '900', color: '#F1F6FF'},
  formSub: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 16},
  registerButton: {marginTop: 8},
  linkRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, marginTop: 8},
  linkHint: {fontSize: 13, color: '#8FA2BB'},
  linkText: {fontSize: 13, fontWeight: '800', color: '#93C5FD'},
  errorBox: {marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.16)'},
  errorText: {color: '#FCA5A5', textAlign: 'center', fontSize: 12, fontWeight: '600'},
});
