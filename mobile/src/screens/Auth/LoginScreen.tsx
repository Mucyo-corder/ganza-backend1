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
        <View style={styles.hero}>
          <Text style={styles.ganza}>GANZA</Text>
        </View>

        <View style={styles.form}>
          <PremiumInput value={email} onChangeText={setEmail} placeholder="Email / Phone" label={t('email')} icon="@" />
          <PremiumInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry label={t('password')} icon="•" />

          <PremiumButton title={t('login')} onPress={handleLogin} size="lg" loading={loading} style={styles.loginButton} />

          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
              <Text style={styles.linkText}>{t('register')}</Text>
            </TouchableOpacity>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        </View>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: SPACING.lg, paddingTop: 60, paddingBottom: 40},
  hero: {alignItems: 'center', marginBottom: 24},
  ganza: {fontSize: 32, fontWeight: '900', letterSpacing: 4, color: '#FFFFFF'},
  form: {borderRadius: 24, padding: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden', position: 'relative'},
  loginButton: {marginTop: 8},
  formActions: {alignItems: 'center', paddingTop: 8},
  linkText: {fontSize: 13, fontWeight: '700', color: '#F5F5F5'},
  errorBox: {marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.16)'},
  errorText: {color: '#FCA5A5', textAlign: 'center', fontSize: 12, fontWeight: '600'},
});
