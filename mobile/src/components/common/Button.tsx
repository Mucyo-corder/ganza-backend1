import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'md':
        return {paddingVertical: 13, paddingHorizontal: SPACING.lg, minHeight: 48};
      case 'lg':
        return {paddingVertical: 15, paddingHorizontal: SPACING.xl, minHeight: 52};
      case 'xl':
        return {paddingVertical: 18, paddingHorizontal: SPACING.xxl, minHeight: 58};
      default:
        return {paddingVertical: 13, paddingHorizontal: SPACING.lg, minHeight: 48};
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'md':
        return 13;
      case 'lg':
        return 14;
      case 'xl':
        return 16;
      default:
        return 13;
    }
  };

  const isGhost = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  if (isGhost) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.ghost, getSizeStyles(), style, disabled && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? <ActivityIndicator color={COLORS.primaryLight} /> : <Text style={[styles.textGhost, {fontSize: getTextSize()}, textStyle]}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  if (isSecondary) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.secondary, getSizeStyles(), style, disabled && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled || loading}
      >
        <View style={styles.sheen} />
        {loading ? <ActivityIndicator color="#EAF2FD" /> : <Text style={[styles.textSecondary, {fontSize: getTextSize()}, textStyle]}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  if (isDanger) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.danger, getSizeStyles(), style, disabled && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.text, {fontSize: getTextSize()}, textStyle]}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  // primary — metallic blue gradient extracted from GANZA icon
  return (
    <TouchableOpacity
      style={[styles.button, styles.primaryWrap, getSizeStyles(), style, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.92}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={['#60A5FA', '#3B82F6', '#2563EB'] as unknown as string[]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.00)'] as unknown as string[]}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 0.55}}
        style={styles.highlight}
      />
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.text, {fontSize: getTextSize()}, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  primaryWrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...SHADOWS.glowSoft,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
  },
  danger: {
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  textSecondary: {
    color: '#EAF2FD',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  textGhost: {
    color: '#93C5FD',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
