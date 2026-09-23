import React from 'react';
import {View, Text, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS} from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
  subtitle?: string;
  icon?: string;
  variant?: 'default' | 'luminous' | 'elevated' | 'subtle' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  headerRight?: React.ReactNode;
}

export const GlassCard: React.FC<Props> = ({
  children,
  style,
  title,
  subtitle,
  icon,
  variant = 'default',
  padding = 'md',
  headerRight,
}) => {
  const isAccent = variant === 'accent';
  const isLuminous = variant === 'luminous';

  return (
    <View style={[styles.shadowWrap, style as ViewStyle]}>
      <View style={[styles.card, stylesByVariant[variant], paddingStyles[padding]]}>
        {/* Top luminous edge gradient */}
        <LinearGradient
          colors={
            isAccent
              ? (['rgba(96,165,250,0.28)', 'rgba(255,255,255,0.00)'] as unknown as string[])
              : isLuminous
              ? (['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.00)'] as unknown as string[])
              : (['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)'] as unknown as string[])
          }
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.topHighlight}
        />

        {/* Inner sheen reflection */}
        <View style={styles.innerSheen} pointerEvents="none" />

        {(title || subtitle || icon || headerRight) && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {icon ? (
                <View style={[styles.iconCircle, isAccent && styles.iconCircleAccent]}>
                  <Text style={styles.iconText}>{icon}</Text>
                </View>
              ) : null}
              <View style={styles.titleWrap}>
                {title ? <Text style={[styles.title, isAccent && styles.titleAccent]}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            </View>
            {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
          </View>
        )}

        <View style={styles.content}>{children}</View>

        {/* Bottom subtle inner shadow line */}
        <View style={styles.bottomLine} />
      </View>
    </View>
  );
};

const paddingStyles = StyleSheet.create({
  none: {padding: 0},
  sm: {padding: SPACING.md},
  md: {padding: SPACING.lg},
  lg: {padding: SPACING.xl},
});

const stylesByVariant: Record<string, ViewStyle> = {
  default: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  luminous: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(176,208,255,0.16)',
  },
  elevated: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  subtle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  accent: {
    backgroundColor: 'rgba(59,130,246,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
  },
};

const styles = StyleSheet.create({
  shadowWrap: {
    ...SHADOWS.medium,
    shadowColor: '#020617',
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  innerSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.015)',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconCircleAccent: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderColor: 'rgba(96,165,250,0.28)',
  },
  iconText: {
    fontSize: 16,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#EAF2FD',
  },
  titleAccent: {
    color: '#BFDBFE',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8FA2BB',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerRight: {
    marginLeft: 12,
  },
  content: {
    // content area
  },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
