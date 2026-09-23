import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, FONT_SIZES, SPACING, BORDER_RADIUS} from '../../constants/theme';

interface Props {
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
  variant?: 'default' | 'compact' | 'large';
  showStatus?: boolean;
}

// Exact GANZA icon as brand mark — uses the real app icon asset
const GANZA_ICON = (() => {
  try {
    // transparent foreground is premium on dark; fallback to icon.png
    return require('../../../assets/android-icon-foreground.png');
  } catch {
    return require('../../../assets/icon.png');
  }
})();

export const GanzaHeader: React.FC<Props> = ({
  onProfilePress,
  onNotificationPress,
  notificationCount = 0,
  variant = 'default',
  showStatus = true,
}) => {
  const isCompact = variant === 'compact';
  const isLarge = variant === 'large';

  return (
    <View style={[styles.container, isCompact && styles.containerCompact, isLarge && styles.containerLarge]}>
      {/* Subtle top luminous border */}
      <View style={styles.topHairline} />

      {/* Logo row */}
      <View style={styles.row}>
        {/* Premium metallic icon container */}
        <View style={styles.logoWrap}>
          {/* Outer luminous glow */}
          <View style={styles.logoGlow} />
          {/* Metallic rim gradient simulation via nested views */}
          <LinearGradient
            colors={['#EAF2FD', '#A9BFD3', '#7BA0C2', '#D8E6F5'] as unknown as string[]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.logoRim}
          >
            <View style={styles.logoInner}>
              {/* Inner glass surface behind icon */}
              <LinearGradient
                colors={['#0A1A33', '#0F2447', '#162A4F'] as unknown as string[]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <Image source={GANZA_ICON} style={styles.logoImage} resizeMode="contain" />
              {/* Top highlight sheen */}
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.00)'] as unknown as string[]}
                start={{x: 0.5, y: 0}}
                end={{x: 0.5, y: 0.45}}
                style={styles.logoSheen}
              />
            </View>
          </LinearGradient>
          {/* Active pulse dot */}
          {showStatus && <View style={styles.liveDot}><View style={styles.liveDotInner} /></View>}
        </View>

        {/* Wordmark */}
        <View style={styles.wordmark}>
          <View style={styles.wordmarkRow}>
            <Text style={[styles.ganza, isCompact && styles.ganzaCompact]}>GANZA</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Autonomous AI Agent • Kinyarwanda-first</Text>
          {!isCompact && (
            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Agent Active</Text>
                <View style={styles.statusDivider} />
                <Text style={styles.statusSub}>Telephone • Computer</Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton} activeOpacity={0.8}>
            <Text style={styles.iconButtonText}>◈</Text>
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onProfilePress} style={[styles.iconButton, styles.profileButton]} activeOpacity={0.8}>
            <LinearGradient
              colors={['#60A5FA', '#3B82F6'] as unknown as string[]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.profileInitial}>G</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metallic divider */}
      <View style={styles.divider}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(170,205,255,0.18)', 'rgba(0,0,0,0)'] as unknown as string[]}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.dividerGradient}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(5,10,27,0.72)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    // glass blur simulated via translucent + shadow
  },
  containerCompact: {
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 10,
  },
  containerLarge: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 18,
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(59,130,246,0.16)',
    top: -8,
    left: -8,
  },
  logoRim: {
    width: 54,
    height: 54,
    borderRadius: 16,
    padding: 1.2,
    shadowColor: '#60A5FA',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoInner: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1930',
    position: 'relative',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  logoSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 22,
    opacity: 0.9,
  },
  liveDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0A1930',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  liveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  wordmark: {
    flex: 1,
    marginLeft: 12,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ganza: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2.4,
    color: '#F1F6FF',
    textShadowColor: 'rgba(96,165,250,0.35)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 12,
  },
  ganzaCompact: {
    fontSize: 18,
    letterSpacing: 2,
  },
  premiumBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
  },
  premiumBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#93C5FD',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: '#8EA2BB',
    marginTop: 1,
  },
  statusRow: {
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EAF2FD',
    letterSpacing: 0.3,
  },
  statusDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 6,
  },
  statusSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B84A0',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  iconButtonText: {
    fontSize: 14,
    color: '#CBD8E6',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#040A1B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  profileButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
  },
  profileInitial: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'transparent',
  },
  dividerGradient: {
    flex: 1,
    height: 1,
  },
});
