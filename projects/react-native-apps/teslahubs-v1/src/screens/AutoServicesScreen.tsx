import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AutoServicesStackParamList, RootStackParamList } from '../navigation/types';
import { AUTO_SERVICE_CATEGORIES, AUTO_SERVICE_PROVIDERS, AutoServiceCategory, getServiceOption } from '../data/autoServices';
import { AS_THEME } from '../theme/autoServicesTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<AutoServicesStackParamList, 'AutoServices'>, NativeStackScreenProps<RootStackParamList>>;

export default function AutoServicesScreen({ navigation }: Props) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<AutoServiceCategory | null>(null);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const categoryFilters: { key: AutoServiceCategory | null; label: string }[] = [
    { key: null, label: t('charging.filterAll') },
    ...AUTO_SERVICE_CATEGORIES.map(c => ({ key: c.key, label: c.label })),
  ];

  const brandFilters = [{ key: null, label: t('charging.filterAll') }, ...AUTO_SERVICE_PROVIDERS.map(p => ({ key: p.id, label: p.name }))];

  const usedServiceIds = useMemo(() => Array.from(new Set(AUTO_SERVICE_PROVIDERS.flatMap(p => p.serviceOptionIds))), []);
  const serviceFilters = [
    { key: null, label: t('charging.filterAll') },
    ...usedServiceIds.map(id => ({ key: id, label: getServiceOption(id)?.name ?? id })),
  ];

  const query = search.trim().toLowerCase();

  const activeBrandLabel = activeProviderId ? brandFilters.find(f => f.key === activeProviderId)?.label : t('autoservices.brand');
  const activeServiceLabel = activeServiceId ? serviceFilters.find(f => f.key === activeServiceId)?.label : t('autoservices.serviceFilter');
  const activeFilterCount = (activeCategory ? 1 : 0) + (activeProviderId ? 1 : 0) + (activeServiceId ? 1 : 0);

  const posts = useMemo(
    () =>
      AUTO_SERVICE_PROVIDERS.flatMap(p =>
        p.sampleWork.map(item => ({
          ...item,
          providerId: p.id,
          providerName: p.name,
          providerColor: p.color,
          providerCategory: p.category,
          serviceName: item.serviceOptionId ? getServiceOption(item.serviceOptionId)?.name : undefined,
        })),
      ),
    [],
  );
  const filteredPosts = posts
    .filter(post => {
      if (activeCategory && post.providerCategory !== activeCategory) return false;
      if (activeProviderId && post.providerId !== activeProviderId) return false;
      if (activeServiceId && post.serviceOptionId !== activeServiceId) return false;
      if (query && !`${post.providerName} ${post.serviceName ?? ''} ${post.caption}`.toLowerCase().includes(query)) return false;
      return true;
    })
    .sort((a, b) => (sortAsc ? a.providerName.localeCompare(b.providerName) : b.providerName.localeCompare(a.providerName)));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.brand}>{t('autoservices.entryTitle')}</Text>
          <Text style={styles.tagline}>{t('autoservices.tagline')}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('autoservices.searchPlaceholder')}
          placeholderTextColor={AS_THEME.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.filterRow}>
        <Pressable style={styles.sortBtn} onPress={() => setSortAsc(v => !v)}>
          <Text style={styles.sortIcon}>{sortAsc ? '↓↑' : '↑↓'}</Text>
        </Pressable>

        <Pressable style={[styles.dropdownPill, activeFilterCount > 0 && styles.dropdownPillActive]} onPress={() => setFiltersOpen(true)}>
          <Text style={[styles.dropdownPillIcon, activeFilterCount > 0 && styles.dropdownPillTextActive]}>☰</Text>
          <Text style={[styles.dropdownPillText, activeFilterCount > 0 && styles.dropdownPillTextActive]}>
            {t('autoservices.filtersBtn')}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>

        <Pressable style={[styles.dropdownPill, activeProviderId && styles.dropdownPillActive]} onPress={() => setBrandOpen(true)}>
          <Text style={[styles.dropdownPillText, !!activeProviderId && styles.dropdownPillTextActive]} numberOfLines={1}>
            {activeBrandLabel}
          </Text>
          <Text style={[styles.dropdownChevronSm, !!activeProviderId && styles.dropdownPillTextActive]}>⌄</Text>
        </Pressable>

        <Pressable style={[styles.dropdownPill, activeServiceId && styles.dropdownPillActive]} onPress={() => setServiceOpen(true)}>
          <Text style={[styles.dropdownPillText, !!activeServiceId && styles.dropdownPillTextActive]} numberOfLines={1}>
            {activeServiceLabel}
          </Text>
          <Text style={[styles.dropdownChevronSm, !!activeServiceId && styles.dropdownPillTextActive]}>⌄</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={filtersOpen} animationType="slide" transparent onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('autoservices.filtersBtn')}</Text>
            <ScrollView>
              {categoryFilters.map(item => {
                const isActive = activeCategory === item.key;
                return (
                  <Pressable
                    key={`cat-${String(item.key)}`}
                    style={styles.optionRow}
                    onPress={() => {
                      setActiveCategory(item.key);
                      setFiltersOpen(false);
                    }}>
                    <Text style={styles.optionName}>{item.label}</Text>
                    {isActive && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={brandOpen} animationType="slide" transparent onRequestClose={() => setBrandOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBrandOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('autoservices.brand')}</Text>
            <ScrollView>
              {brandFilters.map(item => {
                const isActive = activeProviderId === item.key;
                return (
                  <Pressable
                    key={`brand-${String(item.key)}`}
                    style={styles.optionRow}
                    onPress={() => {
                      setActiveProviderId(item.key);
                      setBrandOpen(false);
                    }}>
                    <Text style={styles.optionName}>{item.label}</Text>
                    {isActive && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={serviceOpen} animationType="slide" transparent onRequestClose={() => setServiceOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setServiceOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('autoservices.serviceFilter')}</Text>
            <ScrollView>
              {serviceFilters.map(item => {
                const isActive = activeServiceId === item.key;
                return (
                  <Pressable
                    key={`svc-${String(item.key)}`}
                    style={styles.optionRow}
                    onPress={() => {
                      setActiveServiceId(item.key);
                      setServiceOpen(false);
                    }}>
                    <Text style={styles.optionName}>{item.label}</Text>
                    {isActive && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{t('autoservices.recentPosts')}</Text>
        {filteredPosts.length === 0 ? (
          <Text style={styles.emptyText}>{t('autoservices.noResults')}</Text>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.postsRow}>
              {filteredPosts.map((post, i) => {
                const hasDiscount = post.discountPrice != null && post.originalPrice != null;
                const discountPct = hasDiscount ? Math.round(100 - (post.discountPrice! / post.originalPrice!) * 100) : 0;
                const goToProvider = () => navigation.navigate('AutoServiceProvider', { providerId: post.providerId });
                return (
                  <View key={`${post.providerId}-${i}`} style={styles.postCard}>
                    <Pressable onPress={goToProvider}>
                      <Image source={{ uri: post.thumbnail }} style={styles.postThumbnail} resizeMode="cover" />
                      {post.type === 'video' && (
                        <View style={styles.postPlayBadge}>
                          <Text style={styles.postPlayBadgeText}>▶</Text>
                        </View>
                      )}
                      {hasDiscount && (
                        <View style={styles.postDiscountBadge}>
                          <Text style={styles.postDiscountBadgeText}>-{discountPct}%</Text>
                        </View>
                      )}
                    </Pressable>
                    <Pressable onPress={goToProvider}>
                      <Text style={[styles.postProvider, { color: post.providerColor }]}>{post.providerName}</Text>
                    </Pressable>
                    {post.serviceName && (
                      <Pressable onPress={goToProvider}>
                        <Text style={styles.postServiceName} numberOfLines={1}>
                          {post.serviceName}
                        </Text>
                      </Pressable>
                    )}
                    <Text style={styles.postCaption} numberOfLines={2}>
                      {post.caption}
                    </Text>
                    {hasDiscount ? (
                      <View style={styles.postPriceRow}>
                        <Text style={styles.postPriceOld}>{post.originalPrice} ₼</Text>
                        <Text style={[styles.postPriceNew, { color: post.providerColor }]}>{post.discountPrice} ₼</Text>
                      </View>
                    ) : (
                      post.originalPrice != null && <Text style={styles.postPriceOnly}>{post.originalPrice} ₼</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AS_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerText: { flex: 1, paddingRight: 12 },
  brand: { fontSize: 24, fontWeight: '900', color: AS_THEME.white, letterSpacing: 0.3 },
  tagline: { fontSize: 12.5, color: AS_THEME.textMuted, marginTop: 4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AS_THEME.card,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: AS_THEME.text },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: AS_THEME.card,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: AS_THEME.text,
    fontSize: 14,
  },
  filterList: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 8, alignItems: 'center' },
  sortBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    backgroundColor: AS_THEME.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIcon: { color: AS_THEME.text, fontSize: 15, fontWeight: '700' },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: AS_THEME.border,
    backgroundColor: AS_THEME.card,
    gap: 6,
  },
  dropdownPillActive: { backgroundColor: AS_THEME.primary, borderColor: AS_THEME.primary },
  dropdownPillIcon: { fontSize: 13, color: AS_THEME.text },
  dropdownPillText: { fontSize: 12.5, fontWeight: '600', color: AS_THEME.text, maxWidth: 140 },
  dropdownPillTextActive: { color: AS_THEME.white },
  dropdownChevronSm: { fontSize: 13, color: AS_THEME.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: AS_THEME.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: AS_THEME.text, marginBottom: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AS_THEME.border,
    gap: 10,
  },
  optionName: { fontSize: 14, fontWeight: '600', color: AS_THEME.text, flex: 1 },
  optionCheck: { fontSize: 16, fontWeight: '800', color: AS_THEME.primary },
  scrollBody: { paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AS_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: AS_THEME.textMuted, paddingHorizontal: 20 },
  postsRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  postCard: { width: 150 },
  postThumbnail: { width: 150, height: 100, borderRadius: 12, backgroundColor: AS_THEME.cardAlt },
  postPlayBadge: {
    position: 'absolute',
    top: 34,
    left: 60,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postPlayBadgeText: { color: AS_THEME.white, fontSize: 12 },
  postDiscountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#E23744',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  postDiscountBadgeText: { color: AS_THEME.white, fontSize: 10.5, fontWeight: '800' },
  postProvider: { fontSize: 11, fontWeight: '800', marginTop: 6 },
  postServiceName: { fontSize: 10.5, color: AS_THEME.textMuted, fontWeight: '600', marginTop: 1 },
  postCaption: { fontSize: 11.5, color: AS_THEME.textMuted, marginTop: 2, lineHeight: 15 },
  postPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  postPriceOld: { fontSize: 11, color: AS_THEME.textMuted, textDecorationLine: 'line-through' },
  postPriceNew: { fontSize: 13, fontWeight: '800' },
  postPriceOnly: { fontSize: 12.5, fontWeight: '700', color: AS_THEME.text, marginTop: 4 },
});
