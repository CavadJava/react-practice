import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList, ServicesStackParamList } from '../navigation/types';
import { AUTO_SERVICE_PROVIDERS } from '../data/autoServices';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ServicesStackParamList, 'ServicesGrid'>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

type Tile = { key: string; icon: string; titleKey: string; subtitleKey: string; onPress: (navigation: Props['navigation']) => void };

const TILES: Tile[] = [
  { key: 'carwash', icon: '🧼', titleKey: 'carwash.entryTitle', subtitleKey: 'carwash.entrySubtitle', onPress: nav => nav.navigate('CarWash') },
  { key: 'teslaservice', icon: '🔧', titleKey: 'teslaservice.entryTitle', subtitleKey: 'teslaservice.entrySubtitle', onPress: nav => nav.navigate('TeslaService') },
  { key: 'autoservices', icon: '🛡️', titleKey: 'autoservices.entryTitle', subtitleKey: 'autoservices.entrySubtitle', onPress: nav => nav.navigate('AutoServices') },
  { key: 'doctors', icon: '🩺', titleKey: 'doctors.entryTitle', subtitleKey: 'doctors.entrySubtitle', onPress: nav => nav.navigate('Doctors') },
  { key: 'restaurants', icon: '🍕', titleKey: 'restaurants.entryTitle', subtitleKey: 'restaurants.entrySubtitle', onPress: nav => nav.navigate('Restaurants') },
  { key: 'courses', icon: '🎓', titleKey: 'courses.entryTitle', subtitleKey: 'courses.entrySubtitle', onPress: nav => nav.navigate('Courses') },
  { key: 'cargo', icon: '📦', titleKey: 'cargo.entryTitle', subtitleKey: 'cargo.entrySubtitle', onPress: nav => nav.navigate('Cargo') },
  { key: 'articles', icon: '▤', titleKey: 'articles.title', subtitleKey: 'articles.gridSubtitle', onPress: nav => nav.navigate('Articles') },
];

const AUTO_SERVICE_POSTS = AUTO_SERVICE_PROVIDERS.flatMap(p => p.sampleWork);

export default function ServicesGridScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>{t('tabs.services')}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {TILES.map(tile => {
          const isAutoServices = tile.key === 'autoservices';
          return (
            <Pressable key={tile.key} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]} onPress={() => tile.onPress(navigation)}>
              {isAutoServices && AUTO_SERVICE_POSTS.length > 0 && (
                <View style={styles.tilePostsRow}>
                  {AUTO_SERVICE_POSTS.slice(0, 3).map((post, i) => (
                    <Image key={i} source={{ uri: post.thumbnail }} style={styles.tilePostThumb} resizeMode="cover" />
                  ))}
                </View>
              )}
              <Text style={styles.tileIcon}>{tile.icon}</Text>
              <Text style={styles.tileTitle}>{t(tile.titleKey)}</Text>
              <Text style={styles.tileSubtitle} numberOfLines={2}>
                {isAutoServices ? t('autoservices.postsSubtitle', { count: String(AUTO_SERVICE_POSTS.length) }) : t(tile.subtitleKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: {
      width: '47%',
      backgroundColor: colors.cardAlt,
      borderRadius: radius.xl,
      padding: 16,
      gap: 6,
      minHeight: 130,
      justifyContent: 'center',
    },
    tilePressed: { opacity: 0.85 },
    tilePostsRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
    tilePostThumb: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.bg },
    tileIcon: { fontSize: 28 },
    tileTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    tileSubtitle: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  });
