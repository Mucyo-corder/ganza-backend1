import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES} from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  titleStyle?: object;
  icon?: string;
  variant?: 'default' | 'luminous' | 'accent';
}

export const Card: React.FC<CardProps> = ({children, style, title, titleStyle, icon, variant = 'default'}) => {
  return (
    <View style={[styles.shadowWrap, style as ViewStyle]}>
      <View style={[styles.card, variant === 'luminous' && styles.luminous, variant === 'accent' && styles.accent]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)'] as unknown as string[]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.highlight}
        />
        <View style={styles.sheen} />
        {(title || icon) && (
          <View style={styles.header}>
            {icon ? <View style={styles.iconBox}><Text style={styles.icon}>{icon}</Text></View> : null}
            {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
          </View>
        )}
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    ...SHADOWS.medium,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    position: 'relative',
  },
  luminous: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(176,208,255,0.16)',
  },
  accent: {
    backgroundColor: 'rgba(59,130,246,0.09)',
    borderColor: 'rgba(96,165,250,0.20)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.012)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {fontSize: 16},
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#EAF2FD',
  },
});
