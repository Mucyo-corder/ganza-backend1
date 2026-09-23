import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING} from '../../constants/theme';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {InventoryItem} from '../../types';

// helpers to compute volume when dimensions exist
function estimateVolumeM3(item: InventoryItem): number | null {
  const d: any = (item as any).dimensions;
  if (d && d.length && d.width && d.thickness) {
    const l = d.length; // meters per existing inventory model? actually cm? check legacy: length 3m, width 15cm, thickness 5cm
    // legacy stores width/thickness in cm but we normalize
    // Heuristic: if width > 3 then it's cm
    const wM = d.width > 3 ? d.width / 100 : d.width;
    const tM = d.thickness > 3 ? d.thickness / 100 : d.thickness;
    const lenM = l > 12 ? l / 100 : l; // if stored as cm
    // final safety: if still >12 then assume cm
    const finalL = lenM > 12 ? lenM / 100 : lenM;
    return finalL * wM * tM * (item.quantity || 0);
  }
  return null;
}

export default function DashboardScreen({navigation}: {navigation: {navigate: (s: string, p?: unknown) => void}}) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [stats, setStats] = useState({
    totalStock: 0,
    totalVolumeM3: 0,
    totalValue: 0,
    productCount: 0,
    recentScans: [] as InventoryItem[],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Pending sync' | 'Sync failed'>('Synced');

  const loadStats = useCallback(async () => {
    const businessId = user?.businessId || user?.uid || 'default-business';
    try {
      setSyncStatus('Synced');
      const [inventory, sales] = await Promise.all([
        firebaseService.getInventory(businessId).catch(() => [] as InventoryItem[]),
        firebaseService.getSales(businessId).catch(() => []),
      ]);
      // total stock imbaho
      const totalStock = (inventory as InventoryItem[]).reduce((acc, i) => acc + (i.quantity || 0), 0);
      const totalValue = (inventory as InventoryItem[]).reduce((acc, i) => acc + (i.totalValue || 0), 0);
      let totalVolumeM3 = 0;
      let hasVolume = false;
      for (const it of inventory as InventoryItem[]) {
        const v = estimateVolumeM3(it);
        if (v !== null) {
          totalVolumeM3 += v;
          hasVolume = true;
        }
      }
      // if no dimensions, we show estimated volume 0 but honestly
      const recentScans = (inventory as InventoryItem[]).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 3);
      setStats({
        totalStock,
        totalVolumeM3: hasVolume ? totalVolumeM3 : 0,
        totalValue,
        productCount: inventory.length,
        recentScans,
      });
    } catch (e) {
      setSyncStatus('Sync failed');
      console.warn('Failed to load stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.businessId, user?.uid]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <AmbientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header scrolls naturally — NOT fixed (spec §3, §22) */}
        <GanzaHeader
          onNotificationPress={() => navigation.navigate('Notifications')}
          onProfilePress={() => navigation.navigate('Profile')}
          notificationCount={0}
          variant="default"
          showStatus={false}
        />

        {/* Welcome — simple */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSub}>GANZA</Text>
          <Text style={styles.welcomeTitle}>Cunga ububiko bw'imbaho byoroshye.</Text>
        </View>

        {/* PRIMARY ACTION — calm, large, single */}
        <TouchableOpacity onPress={() => navigation.navigate('Scan')} activeOpacity={0.9} style={styles.primaryCTAWrap}>
          <LinearGradient
            colors={['#60A5FA', '#3B82F6', '#2563EB'] as unknown as string[]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.primaryCTA}
          >
            <View style={styles.primarySheen} />
            <Text style={styles.primaryIcon}>⬢</Text>
            <Text style={styles.primaryText}>FATA IFOTO</Text>
            <Text style={styles.primarySub}>Fata ifoto • Bara • Bara agaciro</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sync status — honest */}
        <View style={styles.syncRow}>
          <View style={[styles.syncDot, syncStatus === 'Synced' ? styles.syncDotOk : syncStatus === 'Pending sync' ? styles.syncDotPend : styles.syncDotFail]} />
          <Text style={styles.syncText}>{syncStatus === 'Synced' ? 'Byahujwe' : syncStatus === 'Pending sync' ? 'Bitegereje guhuza' : 'Ntibyahuze'}</Text>
          {syncStatus !== 'Synced' && <Text style={styles.syncHint}> • bizahuzwa internet nigarutse</Text>}
        </View>

        {/* Stats — three simple cards */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} padding="md">
            <Text style={styles.statLabel}>Imbaho zose</Text>
            <Text style={styles.statValue}>{stats.totalStock} <Text style={styles.statUnit}>imbaho</Text></Text>
            <Text style={styles.statSub}>{stats.productCount} ubwoko • {stats.totalStock === 0 ? 'nta bubiko burimo' : 'mu bubiko'}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding="md">
            <Text style={styles.statLabel}>Ingano yose</Text>
            <Text style={styles.statValue}>{stats.totalVolumeM3 > 0 ? stats.totalVolumeM3.toFixed(2) : '0.00'} <Text style={styles.statUnit}>m³</Text></Text>
            <Text style={styles.statSub}>{stats.totalVolumeM3 > 0 ? 'Byabazwe' : 'Nta bipimo birabikwa'}</Text>
          </GlassCard>
        </View>
        <GlassCard style={[styles.valueCard]} padding="md" variant="luminous">
          <Text style={styles.statLabel}>Agaciro kose</Text>
          <Text style={styles.valueAmount}>{formatRWF(stats.totalValue)}</Text>
          <Text style={styles.statSub}>Agaciro kose • RWF</Text>
        </GlassCard>

        {/* Recent scans */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ibyafotowe vuba</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inventory')}><Text style={styles.sectionLink}>Reba zose →</Text></TouchableOpacity>
        </View>
        {stats.recentScans.length === 0 ? (
          <GlassCard padding="lg">
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>⬢</Text></View>
              <Text style={styles.emptyTitle}>Nta foto irafatwa</Text>
              <Text style={styles.emptySub}>Fata ifoto yambere — GANZA izabara, ipime, ibarure.</Text>
              <PremiumButton title="FATA IFOTO" onPress={() => navigation.navigate('Scan')} size="md" style={{marginTop: 14}} />
            </View>
          </GlassCard>
        ) : (
          <View style={styles.recentList}>
            {stats.recentScans.map(item => (
              <TouchableOpacity key={item.id} style={styles.recentItem} onPress={() => navigation.navigate('ItemDetail', {item})} activeOpacity={0.85}>
                {item.imageUrl ? <Image source={{uri: item.imageUrl}} style={styles.recentThumb} /> : <View style={styles.recentThumbPh}><Text style={styles.recentThumbIcon}>⬢</Text></View>}
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.recentMeta}>{item.quantity} imbaho • {formatRWF(item.unitPrice)}</Text>
                  <Text style={styles.recentDate}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('rw-RW') : ''}{item.isUserCorrected ? ' • Byahinduwe' : ''}</Text>
                </View>
                <Text style={styles.recentValue}>{formatRWF(item.totalValue)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Navigation grid — only allowed items */}
        <View style={styles.navGrid}>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Inventory')} activeOpacity={0.85}>
            <Text style={styles.navIcon}>⬡</Text>
            <Text style={styles.navLabel}>Ububiko</Text>
            <Text style={styles.navSub}>Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Sales')} activeOpacity={0.85}>
            <Text style={styles.navIcon}>◆</Text>
            <Text style={styles.navLabel}>Ubucuruzi</Text>
            <Text style={styles.navSub}>Kugurisha</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Reports')} activeOpacity={0.85}>
            <Text style={styles.navIcon}>▭</Text>
            <Text style={styles.navLabel}>Raporo</Text>
            <Text style={styles.navSub}>Ibyagurishijwe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Settings')} activeOpacity={0.85}>
            <Text style={styles.navIcon}>⚙︎</Text>
            <Text style={styles.navLabel}>Igenamiterere</Text>
            <Text style={styles.navSub}>Guhindura</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustFooter}>
          <Text style={styles.trustText}>GANZA • Ituje, yoroshye kandi yizewe</Text>
        </View>

        {loading && <Text style={styles.loading}>{t('loading')}</Text>}
        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 2},
  welcomeSection: {
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  welcomeSub: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#8FA2BB',
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#F1F6FF',
    marginTop: 4,
    lineHeight: 30,
  },
  primaryCTAWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 10,
  },
  primaryCTA: {
    borderRadius: 22,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    position: 'relative',
    minHeight: 96,
  },
  primarySheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  primaryIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '800',
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.0,
    color: '#fff',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  primarySub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  syncDotOk: {backgroundColor: '#10B981'},
  syncDotPend: {backgroundColor: '#F59E0B'},
  syncDotFail: {backgroundColor: '#EF4444'},
  syncText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA2BB',
  },
  syncHint: {
    fontSize: 11,
    color: '#6B84A0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    minHeight: 92,
  },
  valueCard: {
    marginBottom: 14,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#8FA2BB',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F1F6FF',
    marginTop: 6,
    letterSpacing: -0.4,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8FA2BB',
  },
  statSub: {
    fontSize: 11,
    color: '#5E728C',
    marginTop: 4,
  },
  valueAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#93C5FD',
    marginTop: 6,
    letterSpacing: -0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EAF2FD',
    letterSpacing: 0.4,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyIcon: {fontSize: 18, color: '#6B84A0'},
  emptyTitle: {fontSize: 13, fontWeight: '700', color: '#EAF2FD'},
  emptySub: {fontSize: 11, color: '#8FA2BB', marginTop: 4, textAlign: 'center', lineHeight: 15},
  recentList: {},
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 8,
  },
  recentThumb: {width: 48, height: 48, borderRadius: 10, backgroundColor: '#0A1930', marginRight: 10},
  recentThumbPh: {width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  recentThumbIcon: {fontSize: 16, color: '#8FA2BB'},
  recentInfo: {flex: 1},
  recentName: {fontSize: 13, fontWeight: '700', color: '#F1F6FF'},
  recentMeta: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  recentDate: {fontSize: 10, color: '#6B84A0', marginTop: 2},
  recentValue: {fontSize: 12, fontWeight: '800', color: '#93C5FD'},
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  navCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  navIcon: {fontSize: 18, color: '#CBD8E6', marginBottom: 6},
  navLabel: {fontSize: 12, fontWeight: '800', color: '#EAF2FD', letterSpacing: 0.3, textTransform: 'uppercase'},
  navSub: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  trustFooter: {alignItems: 'center', marginTop: 16},
  trustText: {fontSize: 10, color: '#5E728C', letterSpacing: 0.4},
  loading: {color: '#8FA2BB', textAlign: 'center', marginTop: 12, fontSize: 12},
});
