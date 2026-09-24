import React, {useState} from 'react';
import {View, TextInput, Text, StyleSheet, ViewStyle} from 'react-native';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  error?: string;
  style?: ViewStyle;
  icon?: string;
}

export const PremiumInput: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry,
  keyboardType,
  error,
  style,
  icon,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused, error && styles.inputWrapError]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && <View style={styles.focusGlow} pointerEvents="none" />}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#8FA2BB',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    minHeight: 52,
    position: 'relative',
    overflow: 'hidden',
  },
  inputWrapFocused: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.26)',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.10,
    shadowRadius: 10,
  },
  inputWrapError: {
    borderColor: 'rgba(239,68,68,0.45)',
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
    color: '#8FA2BB',
  },
  input: {
    flex: 1,
    color: '#F1F6FF',
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    paddingVertical: 12,
  },
  focusGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  error: {
    fontSize: 11,
    color: '#FCA5A5',
    marginTop: 6,
    marginLeft: 2,
  },
});
