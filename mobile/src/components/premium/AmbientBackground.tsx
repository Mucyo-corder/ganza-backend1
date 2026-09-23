import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, GRADIENTS} from '../../constants/theme';

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
  return (
    <View style={[styles.container, style as ViewStyle]}>
      <LinearGradient
        colors={GRADIENTS.background as unknown as string[]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      {withOrbs && (
        <>
          {/* Top ambient blue orb — soft luminous highlight */}
          <View style={styles.orbTop} pointerEvents="none" />
          {/* Center subtle steel glow */}
          <View style={styles.orbCenter} pointerEvents="none" />
          {/* Bottom deep accent */}
          <View style={styles.orbBottom} pointerEvents="none" />
          {/* Subtle grid sheen overlay */}
          <View style={styles.sheen} pointerEvents="none" />
        </>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(59,130,246,0.14)',
    // soft blur via opacity layers
  },
  orbCenter: {
    position: 'absolute',
    top: 180,
    left: -100,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(56,189,248,0.06)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -140,
    left: '15%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.012)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
});
