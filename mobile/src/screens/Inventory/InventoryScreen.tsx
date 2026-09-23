import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS} from '../../constants/theme';
import {InventoryItem} from '../../types';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';

export default function InventoryScreen({navigation}: {navigation: {navigate: (s: string, p?: unknown) => void}}) {
  const {t} = useLocalization();
  const {user} = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'recent'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = useCallback(async () => {
    const businessId = user?.businessId || user?.uid || 'default-business';
    try {
      const data = await firebaseService.getInventory(businessId);
      setItems(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('backendError');
      console.warn('Inventory load failed:', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.businessId, user?.uid, t]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(item => {
      if (filter === 'low') return item.quantity > 0 && item.quantity < 5;
      return true;
    })
    .sort((a, b) => {
      if (filter === 'recent') return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name);
    });

  const totalValue = items.reduce((a, i) => a + (i.totalValue || 0), 0);

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(t('remove'), `${t('remove')} "${item.name}"?`, [
      {text: t('cancel'), style: 'cancel'},
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await firebaseService.deleteInventoryItem(item.id);
            loadInventory();
          } catch (e) {
            const msg = e instanceof Error ? e.message : t('backendError');
            Alert.alert(t('error'), msg);
          }
        },
      },
    ]);
  };

  const renderItem = ({item}: {item: InventoryItem}) => {
    const isLow = item.quantity > 0 && item.quantity < 5;
    return (
      <TouchableOpacity style={styles.itemCard} onPress={() => navigation.navigate('ItemDetail', {item})} activeOpacity={0.88}>
        <LinearGradient colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'] as unknown as string[]} style={StyleSheet.absoluteFill} />
        <View style={styles.itemHighlight} />
        {item.imageUrl ? (
          <Image source={{uri: item.imageUrl}} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <LinearGradient colors={['rgba(59,130,246,0.14)', 'rgba(255,255,255,0.04)'] as unknown as string[]} style={StyleSheet.absoluteFill} />
            <Text style={styles.thumbIcon}>⬢</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemDetails}>{item.quantity} {item.unit} • {formatRWF(item.unitPrice)} /pc • {item.category || 'General'}{item.dimensions ? ` • ${item.dimensions.displayStr}` : ''}</Text>
          {item.volumeM3 ? <Text style={styles.itemVolume}>{item.volumeM3.toFixed(3)} m³ • {(item as any).measurementMethod === 'estimated' ? 'Estimated' : 'Measured'}</Text> : null}
          <View style={styles.itemMetaRow}>
            <View style={[styles.qtyPill, isLow && styles.qtyPillLow]}>
              <View style={[styles.qtyDot, isLow && styles.qtyDotLow]} />
              <Text style={[styles.qtyText, isLow && styles.qtyTextLow]}>{item.quantity} imbaho</Text>
            </View>
            {item.isUserCorrected && <StatusPill status="warning" label={t('userCorrected')} />}
            {(item as any).syncStatus === 'pending' && <View style={styles.syncPill}><Text style={styles.syncPillText}>Bitegereje guhuza</Text></View>}
            {(item as any).measurementMethod === 'estimated' && <View style={styles.estimatedPill}><Text style={styles.estimatedPillText}>Estimated</Text></View>}
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemTotal}>{formatRWF(item.totalValue)}</Text>
          <View style={styles.itemActions}>
            <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', {item})} style={styles.iconBtn} activeOpacity={0.8}>
              <View style={styles.actionIconBox}><Text style={styles.actionIcon}>✎</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn} activeOpacity={0.8}>
              <View style={[styles.actionIconBox, styles.actionDeleteBox]}><Text style={styles.actionIconDelete}>×</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AmbientBackground>
      <View style={{flex: 1}}>
        {/* FlatList with header that scrolls — header NOT fixed */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingPulse} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.list, {padding: SPACING.md, paddingTop: 2}]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />}
            ListHeaderComponent={
              <View>
                {/* Header scrolls with list */}
                <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>{t('inventory')}</Text>
                    <Text style={styles.subtitle}>Ububiko • ubwoko {items.length}</Text>
                  </View>
                  <View style={styles.headerValueCard}>
                    <Text style={styles.headerValueLabel}>Agaciro kose</Text>
                    <Text style={styles.headerValue}>{formatRWF(totalValue)}</Text>
                  </View>
                </View>

                {/* Search */}
                <View style={styles.searchWrap}>
                  <Text style={styles.searchIcon}>◈</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Shakisha — izina, ubwoko..."
                    placeholderTextColor="#5E728C"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
                      <Text style={styles.searchClearText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filters */}
                <View style={styles.filters}>
                  {(['all', 'low', 'recent'] as const).map(f => (
                    <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)} activeOpacity={0.85}>
                      <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                        {f === 'all' ? 'Byose' : f === 'low' ? t('lowStock') : 'Vuba'}
                      </Text>
                      {filter === f && <View style={styles.filterDot} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            ListEmptyComponent={
              <GlassCard style={{marginTop: 16}} padding="lg">
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>⬢</Text></View>
                  <Text style={styles.emptyTitle}>{t('noResult')}</Text>
                  <Text style={styles.emptySub}>Nta bicuruzwa bihuye na filter. Ongera ugerageze.</Text>
                </View>
              </GlassCard>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.fabWrap}>
          <PremiumButton title={`＋ ${t('addStock')}`} onPress={() => navigation.navigate('ItemDetail', {})} size="lg" style={{flex: 1, marginRight: 8}} />
          <TouchableOpacity style={styles.scanFab} onPress={() => (navigation as any).navigate('Scan')} activeOpacity={0.88}>
            <LinearGradient colors={['#38BDF8', '#3B82F6'] as unknown as string[]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            <Text style={styles.scanFabIcon}>⬢</Text>
            <Text style={styles.scanFabText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md, paddingTop: 12},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, fontWeight: '500'},
  headerValueCard: {alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  headerValueLabel: {fontSize: 10, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: '#8FA2BB'},
  headerValue: {fontSize: 14, fontWeight: '900', color: '#93C5FD', marginTop: 2},
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 10,
  },
  searchIcon: {fontSize: 13, color: '#6B84A0', marginRight: 8},
  searchInput: {flex: 1, color: '#F1F6FF', fontSize: 14, fontWeight: '500', paddingVertical: 10},
  searchClear: {width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginLeft: 8},
  searchClearText: {fontSize: 16, color: '#8FA2BB', fontWeight: '700'},
  filters: {flexDirection: 'row', marginBottom: 10},
  filterChip: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  filterChipActive: {backgroundColor: '#3B82F6', borderColor: '#60A5FA', shadowColor: '#3B82F6', shadowOpacity: 0.25, shadowRadius: 8},
  filterText: {color: '#8FA2BB', fontSize: 12, fontWeight: '700'},
  filterTextActive: {color: '#fff'},
  filterDot: {width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff', marginLeft: 6},
  insightBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)', marginBottom: 10},
  insightDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA', marginRight: 8},
  insightText: {fontSize: 11, color: '#93C5FD', fontWeight: '500', flex: 1},
  list: {paddingBottom: 120},
  itemCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative',
  },
  itemHighlight: {position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.08)'},
  thumb: {width: 56, height: 56, borderRadius: 14, backgroundColor: '#0A1930', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'},
  thumbPlaceholder: {width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden'},
  thumbIcon: {fontSize: 18, color: '#8FA2BB'},
  itemInfo: {flex: 1},
  itemName: {fontSize: 14, color: '#F1F6FF', fontWeight: '700', letterSpacing: -0.1},
  itemDetails: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  itemVolume: {fontSize: 11, color: '#6B84A0', marginTop: 2, fontFamily: 'monospace'},
  itemMetaRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap'},
  qtyPill: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.10)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.14)', marginRight: 6},
  qtyPillLow: {backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.18)'},
  qtyDot: {width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981', marginRight: 5},
  qtyDotLow: {backgroundColor: '#F59E0B'},
  qtyText: {fontSize: 10, fontWeight: '700', color: '#6EE7B7'},
  qtyTextLow: {color: '#FCD34D'},
  itemRight: {alignItems: 'flex-end', marginLeft: 10},
  itemTotal: {fontSize: 13, color: '#93C5FD', fontWeight: '900'},
  itemActions: {flexDirection: 'row', marginTop: 6},
  iconBtn: {marginLeft: 6},
  actionIconBox: {width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center'},
  actionDeleteBox: {backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.12)'},
  actionIcon: {fontSize: 12, color: '#CBD8E6', fontWeight: '700'},
  actionIconDelete: {fontSize: 16, color: '#FCA5A5', fontWeight: '700', marginTop: -1},
  loadingWrap: {alignItems: 'center', marginTop: 40},
  loadingPulse: {width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.14)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', marginBottom: 12},
  loadingText: {color: '#8FA2BB', fontSize: 12, fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: 8},
  emptyIconBox: {width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  emptyIcon: {fontSize: 20, color: '#6B84A0'},
  emptyTitle: {fontSize: 14, fontWeight: '700', color: '#EAF2FD', textAlign: 'center'},
  emptySub: {fontSize: 12, color: '#8FA2BB', textAlign: 'center', marginTop: 6, lineHeight: 16},
  syncPill: {paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)', marginLeft: 6},
  syncPillText: {fontSize: 9, fontWeight: '700', color: '#FCD34D'},
  estimatedPill: {paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginLeft: 6},
  estimatedPillText: {fontSize: 9, fontWeight: '600', color: '#8FA2BB'},
  fabWrap: {position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center'},
  scanFab: {width: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)'},
  scanFabIcon: {fontSize: 16, color: '#fff', fontWeight: '700'},
  scanFabText: {fontSize: 10, fontWeight: '800', color: '#fff', marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase'},
});
