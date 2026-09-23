import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {Button} from '../../components/common/Button';
import {Input} from '../../components/common/Input';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';

export default function LoginScreen({navigation}: any) {
  const {signIn, error, loading} = useAuth();
  const {t} = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GANZA</Text>
      <Text style={styles.subtitle}>{t('login')}</Text>
      <View style={styles.form}>
        <Input value={email} onChangeText={setEmail} placeholder={t('email')} keyboardType="email-address" label={t('email')} />
        <Input value={password} onChangeText={setPassword} placeholder={t('password')} secureTextEntry label={t('password')} />
        <Button title={t('login')} onPress={handleLogin} variant="primary" size="lg" loading={loading} style={styles.loginButton} />
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>{t('register')}</Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: SPACING.lg},
  logo: {fontSize: FONT_SIZES.xxxl, color: COLORS.gold, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.sm},
  subtitle: {fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl},
  form: {backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOWS.medium},
  loginButton: {marginTop: SPACING.md},
  linkText: {color: COLORS.gold, textAlign: 'center', marginTop: SPACING.md, fontSize: FONT_SIZES.md},
  errorText: {color: COLORS.error, textAlign: 'center', marginTop: SPACING.sm},
});
