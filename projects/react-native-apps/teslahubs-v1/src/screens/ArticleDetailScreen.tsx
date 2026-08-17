import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ArticlesStackParamList } from '../navigation/types';
import { ARTICLES, getArticleCategoryName } from '../data/articles';
import { ThemeColors, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

type Props = NativeStackScreenProps<ArticlesStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const article = ARTICLES.find(a => a.id === route.params.articleId) ?? ARTICLES[0];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Image source={{ uri: article.image }} style={styles.heroImage} resizeMode="cover" />
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{getArticleCategoryName(article.category)}</Text>
          </View>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.meta}>
            {article.author} · {article.date} · {t('articles.readMinutes', { count: article.readMinutes })}
          </Text>

          <View style={styles.divider} />

          {article.content.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingBottom: 40 },
    hero: { width: '100%', height: 260 },
    heroImage: { width: '100%', height: '100%' },
    backBtn: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.lg,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(20,10,10,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: { color: colors.white, fontSize: 18 },
    body: { padding: spacing.xl, gap: spacing.md },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.brandMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    categoryBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
    title: { fontSize: 21, fontWeight: '800', color: colors.text, lineHeight: 27 },
    meta: { fontSize: 12, color: colors.textFaded },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
    paragraph: { fontSize: 14, lineHeight: 23, color: colors.textSecondary },
  });
