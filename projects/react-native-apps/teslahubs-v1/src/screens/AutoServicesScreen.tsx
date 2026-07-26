import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AutoServicesStackParamList, RootStackParamList } from '../navigation/types';
import { AUTO_SERVICE_CAR_BRANDS, AUTO_SERVICE_CITIES, AUTO_SERVICE_PROVIDERS, getServiceOption } from '../data/autoServices';
import { AS_THEME } from '../theme/autoServicesTheme';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<NativeStackScreenProps<AutoServicesStackParamList, 'AutoServices'>, NativeStackScreenProps<RootStackParamList>>;

const PRICE_RANGES: { min: number; max: number | null; label: string }[] = [
  { min: 0, max: 50, label: '0–50 AZN' },
  { min: 50, max: 100, label: '50–100 AZN' },
  { min: 100, max: 250, label: '100–250 AZN' },
  { min: 250, max: 500, label: '250–500 AZN' },
  { min: 500, max: null, label: '500+ AZN' },
];

const DISCOUNT_TIERS: { min: number; labelKey: string }[] = [
  { min: 0, labelKey: 'autoservices.discountAny' },
  { min: 10, labelKey: 'autoservices.discount10' },
  { min: 20, labelKey: 'autoservices.discount20' },
  { min: 30, labelKey: 'autoservices.discount30' },
];

const RATING_TIERS = [4.0, 4.5, 5.0];

export default function AutoServicesScreen({ navigation }: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [activeDiscountMin, setActiveDiscountMin] = useState<number | null>(null);
  const [activeCarBrand, setActiveCarBrand] = useState<string | null>(null);
  const [activePriceRangeIndex, setActivePriceRangeIndex] = useState<number | null>(null);
  const [activeRatingMin, setActiveRatingMin] = useState<number | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('seller');
  const [brandOpen, setBrandOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const brandFilters = [{ key: null, label: t('charging.filterAll') }, ...AUTO_SERVICE_PROVIDERS.map(p => ({ key: p.id, label: p.name }))];

  const usedServiceIds = useMemo(() => Array.from(new Set(AUTO_SERVICE_PROVIDERS.flatMap(p => p.serviceOptionIds))), []);
  const serviceFilters = [
    { key: null, label: t('charging.filterAll') },
    ...usedServiceIds.map(id => ({ key: id, label: getServiceOption(id)?.name ?? id })),
  ];

  const query = search.trim().toLowerCase();

  const activeBrandLabel = activeProviderId ? brandFilters.find(f => f.key === activeProviderId)?.label : t('autoservices.seller');
  const activeServiceLabel = activeServiceId ? serviceFilters.find(f => f.key === activeServiceId)?.label : t('autoservices.serviceFilter');
  const activeFilterCount =
    (activeProviderId ? 1 : 0) +
    (activeServiceId ? 1 : 0) +
    (activeDiscountMin != null ? 1 : 0) +
    (activeCarBrand ? 1 : 0) +
    (activePriceRangeIndex != null ? 1 : 0) +
    (activeRatingMin != null ? 1 : 0) +
    (activeCity ? 1 : 0);

  const toggleSection = (key: string) => setExpandedSection(prev => (prev === key ? null : key));

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (activeProviderId) {
    activeChips.push({ key: 'seller', label: brandFilters.find(f => f.key === activeProviderId)?.label ?? '', onClear: () => setActiveProviderId(null) });
  }
  if (activeServiceId) {
    activeChips.push({ key: 'service', label: serviceFilters.find(f => f.key === activeServiceId)?.label ?? '', onClear: () => setActiveServiceId(null) });
  }
  if (activeDiscountMin != null) {
    const tier = DISCOUNT_TIERS.find(d => d.min === activeDiscountMin);
    activeChips.push({ key: 'discount', label: tier ? t(tier.labelKey) : '', onClear: () => setActiveDiscountMin(null) });
  }
  if (activeCarBrand) {
    activeChips.push({ key: 'carBrand', label: activeCarBrand, onClear: () => setActiveCarBrand(null) });
  }
  if (activePriceRangeIndex != null) {
    activeChips.push({ key: 'price', label: PRICE_RANGES[activePriceRangeIndex].label, onClear: () => setActivePriceRangeIndex(null) });
  }
  if (activeRatingMin != null) {
    activeChips.push({ key: 'rating', label: `⭐ ${activeRatingMin.toFixed(1)}+`, onClear: () => setActiveRatingMin(null) });
  }
  if (activeCity) {
    activeChips.push({ key: 'city', label: activeCity, onClear: () => setActiveCity(null) });
  }

  const resetAllFilters = () => {
    setActiveProviderId(null);
    setActiveServiceId(null);
    setActiveDiscountMin(null);
    setActiveCarBrand(null);
    setActivePriceRangeIndex(null);
    setActiveRatingMin(null);
    setActiveCity(null);
  };

  const posts = useMemo(
    () =>
      AUTO_SERVICE_PROVIDERS.flatMap(p =>
        p.sampleWork.map(item => ({
          ...item,
          providerId: p.id,
          providerName: p.name,
          providerColor: p.color,
          providerCategory: p.category,
          providerCarBrands: p.carBrands,
          providerRating: p.rating,
          providerCity: p.city,
          serviceName: item.serviceOptionId ? getServiceOption(item.serviceOptionId)?.name : undefined,
        })),
      ),
    [],
  );
  const activePriceRange = activePriceRangeIndex != null ? PRICE_RANGES[activePriceRangeIndex] : null;

  const filteredPosts = posts
    .filter(post => {
      if (activeProviderId && post.providerId !== activeProviderId) return false;
      if (activeServiceId && post.serviceOptionId !== activeServiceId) return false;
      if (activeCarBrand && !post.providerCarBrands.includes(activeCarBrand)) return false;
      if (activeRatingMin != null && post.providerRating < activeRatingMin) return false;
      if (activeCity && post.providerCity !== activeCity) return false;
      if (activeDiscountMin != null) {
        const hasDiscount = post.discountPrice != null && post.originalPrice != null;
        if (!hasDiscount) return false;
        if (activeDiscountMin > 0) {
          const pct = Math.round(100 - (post.discountPrice! / post.originalPrice!) * 100);
          if (pct < activeDiscountMin) return false;
        }
      }
      if (activePriceRange) {
        const value = post.discountPrice ?? post.originalPrice;
        if (value == null) return false;
        if (value < activePriceRange.min || (activePriceRange.max != null && value > activePriceRange.max)) return false;
      }
      if (query && !`${post.providerName} ${post.serviceName ?? ''} ${post.caption}`.toLowerCase().includes(query)) return false;
      return true;
    })
    .sort((a, b) => (sortAsc ? a.providerName.localeCompare(b.providerName) : b.providerName.localeCompare(a.providerName)));

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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

      {activeChips.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList} contentContainerStyle={styles.activeChipsRow}>
          {activeChips.map(chip => (
            <Pressable key={chip.key} style={styles.activeChip} onPress={chip.onClear}>
              <Text style={styles.activeChipText} numberOfLines={1}>
                {chip.label}
              </Text>
              <Text style={styles.activeChipClose}>✕</Text>
            </Pressable>
          ))}
          <Pressable style={styles.activeChipClearAll} onPress={resetAllFilters}>
            <Text style={styles.activeChipClearAllText}>{t('autoservices.resetFilters')}</Text>
          </Pressable>
        </ScrollView>
      )}

      <Modal visible={filtersOpen} animationType="slide" transparent onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('autoservices.filtersBtn')}</Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={resetAllFilters}>
                  <Text style={styles.modalResetText}>{t('autoservices.resetFilters')}</Text>
                </Pressable>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('seller')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.seller')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'seller' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'seller' && (
                <View style={styles.sectionChildren}>
                  {brandFilters.map(item => {
                    const isActive = activeProviderId === item.key;
                    return (
                      <Pressable key={`brand-${String(item.key)}`} style={styles.optionRow} onPress={() => setActiveProviderId(item.key)}>
                        <Text style={styles.optionName}>{item.label}</Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('service')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.serviceFilter')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'service' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'service' && (
                <View style={styles.sectionChildren}>
                  {serviceFilters.map(item => {
                    const isActive = activeServiceId === item.key;
                    return (
                      <Pressable key={`svc-${String(item.key)}`} style={styles.optionRow} onPress={() => setActiveServiceId(item.key)}>
                        <Text style={styles.optionName}>{item.label}</Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('discount')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.discount')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'discount' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'discount' && (
                <View style={styles.sectionChildren}>
                  <Pressable style={styles.optionRow} onPress={() => setActiveDiscountMin(null)}>
                    <Text style={styles.optionName}>{t('charging.filterAll')}</Text>
                    {activeDiscountMin == null && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {DISCOUNT_TIERS.map(tier => {
                    const isActive = activeDiscountMin === tier.min;
                    return (
                      <Pressable key={`disc-${tier.min}`} style={styles.optionRow} onPress={() => setActiveDiscountMin(tier.min)}>
                        <Text style={styles.optionName}>{t(tier.labelKey)}</Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('carBrand')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.carBrand')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'carBrand' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'carBrand' && (
                <View style={styles.sectionChildren}>
                  <Pressable style={styles.optionRow} onPress={() => setActiveCarBrand(null)}>
                    <Text style={styles.optionName}>{t('charging.filterAll')}</Text>
                    {!activeCarBrand && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {AUTO_SERVICE_CAR_BRANDS.map(brand => {
                    const isActive = activeCarBrand === brand;
                    return (
                      <Pressable key={`car-${brand}`} style={styles.optionRow} onPress={() => setActiveCarBrand(brand)}>
                        <Text style={styles.optionName}>{brand}</Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('price')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.priceRange')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'price' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'price' && (
                <View style={styles.sectionChildren}>
                  <Pressable style={styles.optionRow} onPress={() => setActivePriceRangeIndex(null)}>
                    <Text style={styles.optionName}>{t('charging.filterAll')}</Text>
                    {activePriceRangeIndex == null && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {PRICE_RANGES.map((range, i) => {
                    const isActive = activePriceRangeIndex === i;
                    return (
                      <Pressable key={`price-${i}`} style={styles.optionRow} onPress={() => setActivePriceRangeIndex(i)}>
                        <Text style={styles.optionName}>{range.label}</Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('rating')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.rating')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'rating' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'rating' && (
                <View style={styles.sectionChildren}>
                  <Pressable style={styles.optionRow} onPress={() => setActiveRatingMin(null)}>
                    <Text style={styles.optionName}>{t('charging.filterAll')}</Text>
                    {activeRatingMin == null && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {RATING_TIERS.map(tier => {
                    const isActive = activeRatingMin === tier;
                    return (
                      <Pressable key={`rating-${tier}`} style={styles.optionRow} onPress={() => setActiveRatingMin(tier)}>
                        <Text style={styles.optionName}>
                          ⭐ {tier.toFixed(1)}
                          {tier < 5 ? '+' : ''}
                        </Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.sectionHeaderRow} onPress={() => toggleSection('city')}>
                <Text style={styles.filterSectionTitle}>{t('autoservices.location')}</Text>
                <Text style={styles.sectionChevron}>{expandedSection === 'city' ? '⌃' : '⌄'}</Text>
              </Pressable>
              {expandedSection === 'city' && (
                <View style={styles.sectionChildren}>
                  <Pressable style={styles.optionRow} onPress={() => setActiveCity(null)}>
                    <Text style={styles.optionName}>{t('charging.filterAll')}</Text>
                    {!activeCity && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {AUTO_SERVICE_CITIES.map(city => {
                    const isActive = activeCity === city;
                    return (
                      <Pressable key={`city-${city}`} style={styles.optionRow} onPress={() => setActiveCity(city)}>
                        <Text style={styles.optionName}>{city}</Text>
                        {isActive && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            <Pressable style={styles.modalApplyBtn} onPress={() => setFiltersOpen(false)}>
              <Text style={styles.modalApplyBtnText}>
                {t('autoservices.showResults', { count: String(filteredPosts.length) })}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={brandOpen} animationType="slide" transparent onRequestClose={() => setBrandOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBrandOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('autoservices.seller')}</Text>
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
                    <Pressable onPress={goToProvider} style={styles.postProviderRow}>
                      <Text style={[styles.postProvider, { color: post.providerColor }]}>{post.providerName}</Text>
                      <Text style={styles.postRating}>⭐ {post.providerRating.toFixed(1)}</Text>
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
                    <Text style={styles.postMetaLine} numberOfLines={1}>
                      📍 {post.providerCity} · 🚗 {post.providerCarBrands.slice(0, 2).join(', ')}
                      {post.providerCarBrands.length > 2 ? '…' : ''}
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
  activeChipsRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 8, alignItems: 'center' },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    height: 30,
    borderRadius: 15,
    backgroundColor: AS_THEME.primaryDark,
    gap: 6,
  },
  activeChipText: { fontSize: 11.5, fontWeight: '600', color: AS_THEME.white, maxWidth: 120 },
  activeChipClose: { fontSize: 11, color: AS_THEME.white, opacity: 0.85 },
  activeChipClearAll: { paddingHorizontal: 4, height: 30, justifyContent: 'center' },
  activeChipClearAllText: { fontSize: 11.5, fontWeight: '700', color: AS_THEME.primary, textDecorationLine: 'underline' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: AS_THEME.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: AS_THEME.text, marginBottom: 10 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalResetText: { fontSize: 12.5, fontWeight: '700', color: AS_THEME.primary, marginBottom: 10 },
  filterSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: AS_THEME.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: AS_THEME.border,
  },
  sectionChevron: { fontSize: 14, color: AS_THEME.textMuted },
  sectionChildren: { paddingLeft: 12, paddingBottom: 4 },
  modalApplyBtn: { marginTop: 14, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: AS_THEME.primary },
  modalApplyBtnText: { fontSize: 14, fontWeight: '700', color: AS_THEME.white },
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
  postCard: { width: 180 },
  postThumbnail: { width: 180, height: 110, borderRadius: 12, backgroundColor: AS_THEME.cardAlt },
  postPlayBadge: {
    position: 'absolute',
    top: 39,
    left: 74,
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
  postProviderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  postProvider: { fontSize: 11, fontWeight: '800' },
  postRating: { fontSize: 10.5, fontWeight: '700', color: AS_THEME.textMuted },
  postServiceName: { fontSize: 10.5, color: AS_THEME.textMuted, fontWeight: '600', marginTop: 1 },
  postCaption: { fontSize: 11.5, color: AS_THEME.textMuted, marginTop: 2, lineHeight: 15 },
  postMetaLine: { fontSize: 10.5, color: AS_THEME.textMuted, marginTop: 3 },
  postPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  postPriceOld: { fontSize: 11, color: AS_THEME.textMuted, textDecorationLine: 'line-through' },
  postPriceNew: { fontSize: 13, fontWeight: '800' },
  postPriceOnly: { fontSize: 12.5, fontWeight: '700', color: AS_THEME.text, marginTop: 4 },
});
