import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme/theme';

export default function HeaderBar({ title, onBack }: { title: string; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.white }]}>←</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: 10 },
  backBtn: { width: 20 },
  backText: { fontSize: 20 },
  title: { fontWeight: '800', fontSize: 17 },
});
