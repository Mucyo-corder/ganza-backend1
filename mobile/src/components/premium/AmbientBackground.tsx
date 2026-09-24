import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {COLORS} from '../../constants/theme';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withOrbs?: boolean;
}

/**
 * Premium dark background with soft ambient blue lighting
 * Extracted from GANZA icon's silver-blue metallic DNA
 */
export const AmbientBackground: React.FC<Props> = ({children, style, withOrbs = true}) => {
  return <View style={[styles.container, style as ViewStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
});
