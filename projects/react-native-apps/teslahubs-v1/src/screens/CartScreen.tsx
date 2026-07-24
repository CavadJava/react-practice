import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CITIES, REGIONS, WHATSAPP_PHONE, getProductImage } from '../data/products';
import { ThemeColors, radius, spacing, withAlpha } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import HeaderBar from '../components/HeaderBar';
import MapPickerModal from '../components/MapPickerModal';
import SelectField from '../components/SelectField';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

function computeDelivery(now: Date) {
  const eta = new Date(now.getTime() + 3 * 3600000);
  const isToday = eta.getDate() === now.getDate();
  const time = eta.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  return { isToday, time };
}

// The WhatsApp order message always uses Azerbaijani "bugün"/"sabah", regardless of
// the UI language, since it's a business document read by the (Azerbaijani-speaking) shop owner.
function formatDeliveryAz({ isToday, time }: { isToday: boolean; time: string }) {
  return `${isToday ? 'bugün' : 'sabah'}, ${time}`;
}

export default function CartScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLocale();
  const { format } = useCurrency();
  const { cartItems, cartCount, increment, decrement, orderTotal } = useCart();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('994102344071');
  const [city, setCity] = useState('baku');
  const [region, setRegion] = useState('Yasamal');
  const [urgent, setUrgent] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const isBaku = city === 'baku';
  const delivery = useMemo(() => computeDelivery(new Date()), []);
  const deliveryTimeLabel = `${delivery.isToday ? t('cart.today') : t('cart.tomorrow')}, ${delivery.time}`;
  const cities = useMemo(() => CITIES.map(c => ({ value: c.value, label: t(`city.${c.value}`) })), [t]);

  const canSend = !!(firstName.trim() && lastName.trim() && phone.trim() && cartItems.length && isBaku);
  const missingHint = useMemo(() => {
    const missing: string[] = [];
    if (!firstName.trim()) missing.push(t('cart.missingFirstName'));
    if (!lastName.trim()) missing.push(t('cart.missingLastName'));
    if (!phone.trim()) missing.push(t('cart.missingPhone'));
    if (!isBaku) missing.push(t('cart.missingCity'));
    return missing.length ? `${t('cart.missingPrefix')}${missing.join(', ')}` : '';
  }, [firstName, lastName, phone, isBaku, t]);

  const locationLabel =
    locationConfirmed && coords
      ? t('cart.selectedLocation', { lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5) })
      : t('cart.noLocation');

  const handleSend = () => {
    if (!canSend) return;
    const now = new Date();
    const finalDelivery = computeDelivery(now);
    const finalDeliveryTimeAz = formatDeliveryAz(finalDelivery);
    const hasCoords = locationConfirmed && coords;
    const mapsLink = hasCoords
      ? `https://www.google.com/maps?q=${coords!.lat.toFixed(6)},${coords!.lng.toFixed(6)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Baku, ' + region + ', Azerbaijan')}`;
    const coordsText = hasCoords ? `${coords!.lat.toFixed(6)}, ${coords!.lng.toFixed(6)}` : 'Qeyd edilməyib';

    const lines = [
      'Salam!',
      '',
      'Yeni sifariş:',
      '',
      '━━━━━━━━━━━━━━',
      ...cartItems.flatMap(ci => [
        `📦 Məhsul`,
        `${ci.product.name} × ${ci.qty}`,
        '',
        `💰 Qiymət`,
        format(ci.product.price * ci.qty),
        '',
      ]),
      `👤 Müştəri`,
      `${firstName} ${lastName}`,
      '',
      `📞 Telefon`,
      `+${phone}`,
      '',
      `🏙️ Şəhər`,
      'Bakı',
      '',
      `📍 Rayon`,
      region,
      '',
      `🌐 Latitude, Longitude`,
      coordsText,
      '',
      `🗺️ Google Location`,
      mapsLink,
      '',
      `🕒 Çatdırılma vaxtı`,
      finalDeliveryTimeAz + (urgent ? ' (TƏCİLİ)' : ''),
      '',
      `💵 Ümumi`,
      format(orderTotal),
      '━━━━━━━━━━━━━━',
      '',
      'Sifarişimin təsdiqlənməsini gözləyirəm. Təşəkkür edirəm!',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`);

    navigation.navigate('OrderConfirm', {
      firstName,
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
      itemCount: cartCount,
      deliveryTime: `${finalDelivery.isToday ? t('cart.today') : t('cart.tomorrow')}, ${finalDelivery.time}`,
      total: format(orderTotal),
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <HeaderBar title={t('cart.title')} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cartList}>
            {cartItems.map(ci => (
              <View key={ci.product.id} style={styles.cartItem}>
                <View style={[styles.cartThumb, { backgroundColor: ci.product.placeholderColor }]}>
                  <Image source={{ uri: getProductImage(ci.product) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={2}>
                    {ci.product.name}
                  </Text>
                  <Text style={styles.cartItemPrice}>{format(ci.product.price * ci.qty)}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepperBtn} onPress={() => decrement(ci.product.id)}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperQty}>{ci.qty}</Text>
                  <Pressable style={styles.stepperBtn} onPress={() => increment(ci.product.id)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {cartItems.length === 0 && <Text style={styles.emptyText}>{t('cart.empty')}</Text>}
          </View>

          {cartItems.length > 0 && (
            <View style={styles.form}>
              <View style={styles.divider} />
              <Text style={styles.formTitle}>{t('cart.deliveryDetails')}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>{t('cart.firstName')}</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t('cart.firstNamePlaceholder')}
                  placeholderTextColor={colors.textFaded}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t('cart.lastName')}</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t('cart.lastNamePlaceholder')}
                  placeholderTextColor={colors.textFaded}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t('cart.phone')}</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('cart.phonePlaceholder')}
                  placeholderTextColor={colors.textFaded}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
              <SelectField label={t('cart.city')} value={city} options={cities} onChange={setCity} />

              {isBaku ? (
                <>
                  <SelectField label={t('cart.district')} value={region} options={REGIONS.map(r => ({ label: r, value: r }))} onChange={setRegion} />

                  <Pressable style={styles.mapBtn} onPress={() => setShowMap(true)}>
                    <Text style={styles.mapBtnLabel}>📍 {locationLabel}</Text>
                    <Text style={styles.mapBtnAction}>{t('cart.chooseOnMap')}</Text>
                  </Pressable>

                  <Pressable style={styles.urgentRow} onPress={() => setUrgent(u => !u)}>
                    <Switch
                      value={urgent}
                      onValueChange={setUrgent}
                      trackColor={{ true: colors.brand, false: colors.borderLight }}
                      thumbColor={colors.white}
                    />
                    <Text style={styles.urgentLabel}>{t('cart.urgentDelivery')}</Text>
                  </Pressable>

                  <View style={styles.deliveryBox}>
                    <Text style={styles.deliveryBoxTitle}>{t('cart.deliveryTime')}</Text>
                    <Text style={styles.deliveryBoxTime}>{deliveryTimeLabel}</Text>
                    <Text style={styles.deliveryBoxNote}>{t('cart.deliveryNote')}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>{t('cart.bakuOnlyNotice')}</Text>
                </View>
              )}

              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('cart.total')}</Text>
                <Text style={styles.totalValue}>{format(orderTotal)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {cartItems.length > 0 && (
          <View style={styles.footer}>
            {!canSend && missingHint !== '' && <Text style={styles.missingHint}>{missingHint}</Text>}
            <Pressable
              style={[styles.sendBtn, { backgroundColor: canSend ? colors.brand : colors.cardAlt }]}
              onPress={handleSend}
              disabled={!canSend}>
              <Text style={[styles.sendBtnText, { color: canSend ? colors.white : colors.textFaded }]}>{t('cart.send')}</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <MapPickerModal
        visible={showMap}
        initialCoords={coords}
        onClose={() => setShowMap(false)}
        onConfirm={c => {
          setCoords(c);
          setLocationConfirmed(true);
          setShowMap(false);
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    flexOne: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 150 },
    cartList: { gap: 10 },
    cartItem: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 10,
      alignItems: 'center',
    },
    cartThumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
    cartItemInfo: { flex: 1, gap: 4 },
    cartItemName: { fontSize: 13, fontWeight: '600', lineHeight: 17, color: colors.text },
    cartItemPrice: { fontSize: 14, fontWeight: '800', color: colors.text },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.cardAlt,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    stepperBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperBtnText: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 16 },
    stepperQty: { color: colors.text, fontSize: 14, fontWeight: '700', minWidth: 14, textAlign: 'center' },
    emptyText: { textAlign: 'center', paddingVertical: 40, color: colors.textFaded, fontSize: 14 },
    form: { gap: 16, paddingTop: 6 },
    divider: { height: 1, backgroundColor: colors.divider },
    formTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    field: { gap: 6 },
    label: { fontSize: 12.5, color: colors.textFaded, fontWeight: '600' },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 14,
    },
    mapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    mapBtnLabel: { color: colors.text, fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
    mapBtnAction: { color: colors.brandLight, fontWeight: '700', fontSize: 12 },
    urgentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    urgentLabel: { fontSize: 13.5, fontWeight: '600', color: colors.text },
    deliveryBox: {
      backgroundColor: withAlpha(colors.brand, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(colors.brand, 0.4),
      borderRadius: radius.md,
      padding: 14,
      gap: 4,
    },
    deliveryBoxTitle: { fontSize: 12, color: colors.brandLight, fontWeight: '600' },
    deliveryBoxTime: { fontSize: 15, fontWeight: '800', color: colors.text },
    deliveryBoxNote: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 16, marginTop: 2 },
    notice: {
      backgroundColor: withAlpha(colors.border, 0.4),
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      padding: 14,
    },
    noticeText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 20, fontWeight: '800', color: colors.text },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingHorizontal: spacing.xl,
      paddingTop: 14,
      paddingBottom: 26,
      gap: 8,
    },
    missingHint: { fontSize: 12, color: colors.brandLight, textAlign: 'center' },
    sendBtn: { borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
    sendBtnText: { fontSize: 15, fontWeight: '700' },
  });
