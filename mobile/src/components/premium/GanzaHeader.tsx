import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
  variant?: 'default' | 'compact' | 'large';
  showStatus?: boolean;
}

const GANZA_ICON = (() => {
  try {
    return require('../../../assets/android-icon-foreground.png');
  } catch {
    return require('../../../assets/icon.png');
  }
})();

/**
 * GANZA header — CALM, SIMPLE, NOT FIXED.
 * This component MUST scroll with page content (parent is ScrollView).
 * Do NOT make it sticky. No glass blur that requires fixed positioning.
 * Spec §3 + §22: header is part of normal scrollable content.
 */
export const GanzaHeader: React.FC<Props> = ({
  onProfilePress,
  onNotificationPress,
  notificationCount = 0,
  variant = 'default',
  showStatus = false,
}) => {
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      {/* Logo row — scrolls naturally */}
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['#EAF2FD', '#A9BFD3', '#7BA0C2'] as unknown as string[]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.logoRim}
          >
            <View style={styles.logoInner}>
              <LinearGradient
                colors={['#0A1A33', '#0F2447', '#162A4F'] as unknown as string[]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <Image source={GANZA_ICON} style={styles.logoImage} resizeMode="contain" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.wordmark}>
          <Text style={[styles.ganza, isCompact && styles.ganzaCompact]}>GANZA</Text>
          <Text style={styles.tagline}>Manage your wood stock easily.</Text>
          {showStatus && (
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Wood inventory • Calm & precise</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {onNotificationPress ? (
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton} activeOpacity={0.8}>
              <Text style={styles.iconButtonText}>◈</Text>
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
          {onProfilePress ? (
            <TouchableOpacity onPress={onProfilePress} style={[styles.iconButton, styles.profileButton]} activeOpacity={0.8}>
              <LinearGradient colors={['#60A5FA', '#3B82F6'] as unknown as string[]} style={StyleSheet.absoluteFill} />
              <Text style={styles.profileInitial}>G</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Thin divider — part of scrollable content, not fixed */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    // NO position, NO sticky, NO fixed
  },
  containerCompact: {
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRim: {
    width: 48,
    height: 48,
    borderRadius: 14,
    padding: 1,
  },
  logoInner: {
    flex: 1,
    borderRadius: 13,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1930',
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  wordmark: {
    flex: 1,
    marginLeft: 12,
  },
  ganza: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2.2,
    color: '#F1F6FF',
  },
  ganzaCompact: {
    fontSize: 18,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8EA2BB',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  iconButtonText: {
    fontSize: 13,
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
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: 'rgba(96,165,250,0.25)',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 12,
  },
});
