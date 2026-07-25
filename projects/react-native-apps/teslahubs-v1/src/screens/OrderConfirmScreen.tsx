import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ThemeColors, radius } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCart } from '../context/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirm'>;

export default function OrderConfirmScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { clearCart } = useCart();
  const { firstName, fullName, phone, itemCount, deliveryTime, total } = route.params;

  const backToHome = () => {
    clearCart();
    navigation.popToTop();
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.check}>
          <Text style={styles.checkText}>✓</Text>
        </View>
        <Text style={styles.title}>{t('confirm.title')}</Text>
        <Text style={styles.subtitle}>{t('confirm.subtitle', { name: firstName })}</Text>

        <View style={styles.summary}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('confirm.recipient')}</Text>
            <Text style={styles.rowValue}>{fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('confirm.phone')}</Text>
            <Text style={styles.rowValue}>{phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('confirm.itemCount')}</Text>
            <Text style={styles.rowValue}>{itemCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('confirm.deliveryTime')}</Text>
            <Text style={styles.rowValueAccent}>{deliveryTime}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>{t('confirm.total')}</Text>
            <Text style={styles.totalValue}>{total}</Text>
          </View>
        </View>

        <Pressable style={styles.homeBtn} onPress={backToHome}>
          <Text style={styles.homeBtnText}>{t('confirm.backHome')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 70, paddingBottom: 40 },
    check: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
    },
    checkText: { fontSize: 34, color: colors.white },
    title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 13.5, color: colors.textMuted, lineHeight: 21, textAlign: 'center', marginBottom: 28 },
    summary: { width: '100%', backgroundColor: colors.card, borderRadius: radius.xl, padding: 18, gap: 12, marginBottom: 24 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    rowLabel: { fontSize: 13, color: colors.textFaded },
    rowValue: { fontSize: 13, fontWeight: '700', color: colors.text },
    rowValueAccent: { fontSize: 13, fontWeight: '700', color: colors.brandLight },
    divider: { height: 1, backgroundColor: colors.dividerStrong },
    totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 15, fontWeight: '800', color: colors.text },
    homeBtn: { width: '100%', backgroundColor: colors.brand, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
    homeBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  });
