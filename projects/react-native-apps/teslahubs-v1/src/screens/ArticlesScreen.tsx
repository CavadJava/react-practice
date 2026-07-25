import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ArticlesStackParamList } from '../navigation/types';
import { ARTICLES, getArticleCategoryName } from '../data/articles';
import { ThemeColors, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = NativeStackScreenProps<ArticlesStackParamList, 'Articles'>;

export default function ArticlesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>{t('articles.title')}</Text>
      <FlatList
        data={ARTICLES}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('articles.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.body}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{getArticleCategoryName(item.category)}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.excerpt} numberOfLines={2}>
                {item.excerpt}
              </Text>
              <Text style={styles.meta}>
                {item.author} · {t('articles.readMinutes', { count: item.readMinutes })}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: 14 },
    emptyText: { textAlign: 'center', color: colors.textFaded, fontSize: 14, marginTop: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPressed: { opacity: 0.85 },
    image: { width: '100%', height: 150 },
    body: { padding: spacing.md, gap: 6 },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.brandMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    categoryBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 20 },
    excerpt: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    meta: { fontSize: 11.5, color: colors.textFaded, marginTop: 2 },
  });
