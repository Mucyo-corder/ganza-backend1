import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle, TextStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'metallic' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const PremiumButton: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth,
}) => {
  const isPrimary = variant === 'primary' || variant === 'metallic';
  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';

  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const textSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={isGhost ? COLORS.primaryLight : '#fff'} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <Text style={[styles.icon, {fontSize: textSize + 2}]}>{icon}</Text> : null}
          <Text style={[styles.text, {fontSize: textSize}, isGhost && styles.textGhost, isSecondary && styles.textSecondary, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </>
  );

  if (isGhost) {
    return (
      <TouchableOpacity
        style={[styles.base, styles.ghost, sizeStyle, disabled && styles.disabled, fullWidth && {alignSelf: 'stretch'}, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  if (isSecondary) {
    return (
      <TouchableOpacity
        style={[styles.base, styles.secondary, sizeStyle, disabled && styles.disabled, fullWidth && {alignSelf: 'stretch'}, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        <View style={styles.secondarySheen} />
        {content}
      </TouchableOpacity>
    );
  }

  // Primary / metallic with gradient
  return (
    <TouchableOpacity
      style={[styles.base, styles.primaryWrap, sizeStyle, disabled && styles.disabled, fullWidth && {alignSelf: 'stretch'}, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.92}
    >
      <LinearGradient
        colors={
          variant === 'metallic'
            ? (['#EAF2FD', '#A9BFD3', '#7BA0C2'] as unknown as string[])
            : (['#60A5FA', '#3B82F6', '#2563EB'] as unknown as string[])
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={StyleSheet.absoluteFill}
      />
      {/* Top highlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.00)'] as unknown as string[]}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 0.6}}
        style={styles.primaryHighlight}
      />
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    minHeight: 48,
  },
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 38,
    borderRadius: 12,
  },
  md: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
    borderRadius: 16,
  },
  primaryWrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    ...SHADOWS.glowSoft,
  },
  primaryHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondarySheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#fff',
    textAlign: 'center',
  },
  textSecondary: {
    color: '#EAF2FD',
  },
  textGhost: {
    color: '#93C5FD',
  },
});
