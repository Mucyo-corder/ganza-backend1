import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {COLORS, FONT_SIZES} from '../../constants/theme';

interface CustomTextProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  bold?: boolean;
  style?: object;
}

export const CustomText: React.FC<CustomTextProps> = ({
  children,
  size = FONT_SIZES.md,
  color = COLORS.text,
  bold = false,
  style,
}) => {
  return (
    <Text style={[styles.text, {fontSize: size, color: color, fontWeight: bold ? '700' : '400'}, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System',
  },
});
