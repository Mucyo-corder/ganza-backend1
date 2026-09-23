import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, Image} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../hooks/useAuth';
import {useLocalization} from '../../localization/LocalizationContext';
import {firebaseService} from '../../services/FirebaseService';
import {Button} from '../../components/common/Button';
import {formatRWF} from '../../utils/formatters';
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS} from '../../constants/theme';
import {InventoryItem} from '../../types';

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
      // Honest offline
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
    }, [loadInventory])
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

  const renderItem = ({item}: {item: InventoryItem}) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => navigation.navigate('ItemDetail', {item})} activeOpacity={0.85}>
      {item.imageUrl ? <Image source={{uri: item.imageUrl}} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbPlaceholder]}><Text style={styles.thumbText}>📦</Text></View>}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.quantity} {item.unit} • {formatRWF(item.unitPrice)} /pc
        </Text>
        {item.isUserCorrected && <Text style={styles.corrected}>⚠ {t('userCorrected')}</Text>}
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.itemTotal}>{formatRWF(item.totalValue)}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', {item})} style={styles.iconBtn}>
            <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('inventory')}</Text>
        <Text style={styles.subtitle}>{items.length} {t('productCount')} • {formatRWF(items.reduce((a, i) => a + i.totalValue, 0))}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={t('search')}
        placeholderTextColor={COLORS.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
      />

      <View style={styles.filters}>
        {(['all', 'low', 'recent'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? t('filter') + ': All' : f === 'low' ? t('lowStock') : t('history')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loadingText}>{t('loading')}</Text>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noResult')}</Text>}
        />
      )}

      <View style={styles.fabWrap}>
        <Button title={`+ ${t('addStock')}`} onPress={() => navigation.navigate('ItemDetail', {})} variant="primary" size="lg" />
        <Button title={`📷 ${t('scanBoards')}`} onPress={() => navigation.navigate('Scan')} variant="secondary" style={{marginTop: SPACING.sm}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: SPACING.md},
  header: {marginBottom: SPACING.md},
  title: {fontSize: FONT_SIZES.xl, color: COLORS.cream, fontWeight: '800'},
  subtitle: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4},
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  filters: {flexDirection: 'row', marginBottom: SPACING.md},
  filterChip: {paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.surface, borderRadius: 20, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border},
  filterChipActive: {backgroundColor: COLORS.gold, borderColor: COLORS.gold},
  filterText: {color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600'},
  filterTextActive: {color: COLORS.background},
  list: {paddingBottom: 160},
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  thumb: {width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.surface, marginRight: SPACING.md},
  thumbPlaceholder: {justifyContent: 'center', alignItems: 'center'},
  thumbText: {fontSize: 22},
  itemInfo: {flex: 1},
  itemName: {fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '700'},
  itemDetails: {fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2},
  corrected: {fontSize: FONT_SIZES.xs, color: COLORS.warning, marginTop: 2},
  itemTotal: {fontSize: FONT_SIZES.md, color: COLORS.gold, fontWeight: '800'},
  itemActions: {flexDirection: 'row', marginTop: 4},
  iconBtn: {padding: 4, marginLeft: 6},
  loadingText: {color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl},
  emptyText: {color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl},
  fabWrap: {position: 'absolute', bottom: 16, left: 16, right: 16},
});
