import React, {useState} from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  error?: string;
  label?: string;
  style?: object;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  label,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrap, focused && styles.wrapFocused, error && styles.wrapError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && <View style={styles.glow} pointerEvents="none" />}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 10,
    color: '#8FA2BB',
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  wrapFocused: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(96,165,250,0.45)',
  },
  wrapError: {
    borderColor: 'rgba(239,68,68,0.45)',
  },
  input: {
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 52,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.45)',
  },
  error: {
    fontSize: 11,
    color: '#FCA5A5',
    marginTop: 6,
  },
});
