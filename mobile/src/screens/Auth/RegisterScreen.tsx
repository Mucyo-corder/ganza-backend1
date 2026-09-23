import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {Button} from '../../components/common/Button';
import {Input} from '../../components/common/Input';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';

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
    try {
      await signUp(email, password, displayName);
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GANZA</Text>
      <Text style={styles.subtitle}>{t('register')}</Text>
      <View style={styles.form}>
        <Input value={displayName} onChangeText={setDisplayName} placeholder={t('fullName')} label={t('fullName')} />
        <Input value={email} onChangeText={setEmail} placeholder={t('email')} keyboardType="email-address" label={t('email')} />
        <Input value={password} onChangeText={setPassword} placeholder={t('password')} secureTextEntry label={t('password')} />
        <Input value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t('confirmPassword')} secureTextEntry label={t('confirmPassword')} />
        <Button title={t('register')} onPress={handleRegister} variant="primary" size="lg" loading={loading} style={styles.registerButton} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>{t('login')}</Text>
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
  registerButton: {marginTop: SPACING.md},
  linkText: {color: COLORS.gold, textAlign: 'center', marginTop: SPACING.md},
  errorText: {color: COLORS.error, textAlign: 'center', marginTop: SPACING.sm},
});
