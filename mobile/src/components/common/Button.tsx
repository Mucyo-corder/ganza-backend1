import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle} from 'react-native';
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
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {backgroundColor: COLORS.gold, ...SHADOWS.medium};
      case 'secondary':
        return {backgroundColor: COLORS.primaryLight};
      case 'outline':
        return {backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.gold};
      case 'danger':
        return {backgroundColor: COLORS.error};
      default:
        return {backgroundColor: COLORS.gold};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'md':
        return {paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg};
      case 'lg':
        return {paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl};
      case 'xl':
        return {paddingVertical: SPACING.xl, paddingHorizontal: SPACING.xxl};
      default:
        return {paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg};
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'md':
        return FONT_SIZES.md;
      case 'lg':
        return FONT_SIZES.lg;
      case 'xl':
        return FONT_SIZES.xl;
      default:
        return FONT_SIZES.md;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getVariantStyles(), getSizeStyles(), style, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.background} />
      ) : (
        <Text style={[styles.text, {fontSize: getTextSize()}, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    color: COLORS.background,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
