# Resume düyməsi — `src/components/CargoResumeButton.tsx`

`#floating-ui` `#ux`

## Nə edir

İstifadəçi Kargo overlay-ini gizlədib tətbiqin başqa bir yerinə keçəndə
(məs. Restoran bölməsinə), açıq Kargo sessiyaları "unudulmasın" deyə,
ekranın sağ-aşağı küncündə üzən (floating), açıq sessiya sayını göstərən
bir düymə göstərir. Bu, əvvəlki bir tələbdə "dinamik field" adlandırılmış
konsepsiyanın konkret həyata keçirilməsidir.

## Harada mount olunur

`App.tsx`-də, `CargoWebViewOverlay` ilə eyni səviyyədə:

```tsx
<CargoSessionsProvider>
  <RootNavigator />
  <CargoWebViewOverlay />
  <CargoResumeButton />
</CargoSessionsProvider>
```

`RootNavigator`-ın **kənarında**, yəni tətbiqin **istənilən ekranında**
görünə bilər (Kargo modulunun özündə deyilsə belə) — bu, `CargoWebViewOverlay`
ilə eyni memarlıq səbəbindəndir: naviqasiyadan asılı olmayan qlobal UI
elementi.

## Görünmə şərtləri

```tsx
if (sessionIds.length === 0 || overlayVisible || !buttonEnabled) return null;
```

Üç şərtin **hamısı** yalan olmalıdır ki, düymə görünsün:

1. `sessionIds.length === 0` → heç bir açıq sessiya yoxdursa, "davam et"-mək üçün heç nə yoxdur.
2. `overlayVisible` → overlay onsuz da ekrandadırsa, üzən düymə lazımsızdır (üst-üstə düşərdi).
3. `!buttonEnabled` → istifadəçi düyməni özü söndürübsə (uzun basma ilə, aşağıya bax).

## Badge (say göstəricisi) — "dinamik" hissə

```tsx
<Pressable style={[styles.button, { bottom: insets.bottom + 24 }]} onPress={showOverlay} onLongPress={() => setButtonEnabled(false)} delayLongPress={400}>
  <Text style={styles.icon}>📦</Text>
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{sessionIds.length}</Text>
  </View>
</Pressable>
```

`sessionIds.length` birbaşa göstərilir — yeni tab açılanda/bağlananda
avtomatik yenilənir, çünki `CargoSessionsContext`-dən gələn `sessionIds`
dəyişəndə komponent yenidən render olunur. Buna görə "dinamik" adlanır:
statik ikon deyil, canlı vəziyyəti əks etdirir.

`insets.bottom + 24` — `useSafeAreaInsets()`-dən gələn təhlükəsiz-zona
məsafəsi + sabit 24px boşluq, cihazlarda (xüsusən aşağıda "home indicator"
olan iPhone-larda) düymənin sistem elementləri ilə üst-üstə düşməməsi üçün.

## Uzun basma → düyməni söndürmək

```tsx
onLongPress={() => setButtonEnabled(false)}
delayLongPress={400}
```

400ms basılı saxlanılsa, `buttonEnabled = false` olur və düymə özü `null`
render edir (yuxarıdakı şərt). **Diqqət**: bu, sessiyaları bağlamır —
yalnız üzən düymənin görünürlüyünü söndürür. İstifadəçi sessiyalara yenə
`CargoScreen`-dəki "davam et" banner-i ilə çata bilər.

Geri yandırmaq yalnız [`CargoScreen`](07-cargo-screen.md)-dəki `Switch`
vasitəsilə mümkündür (bax ora) — `CargoResumeButton`-un özündə "yenidən
yandır" düyməsi yoxdur (məntiqli, çünki düymə görünmürsə, ona basıla bilməz).

## Niyə `Pressable`, `TouchableOpacity` yox?

Tətbiqin bütün digər Kargo komponentləri kimi (`CargoScreen`,
`CargoWebViewOverlay`) `Pressable` işlədilir — bu, React Native-in daha
müasir, çevik toxunuş komponentidir (`onLongPress`, `delayLongPress`,
`hitSlop` kimi prop-ları rahat dəstəkləyir), konvensiya olaraq bütün yeni
kodda `TouchableOpacity` əvəzinə bu işlədilir.

## Çağırıldığı context

Yalnız [`useCargoSessions`](05-sessions-context.md) — `sessionIds`,
`overlayVisible`, `buttonEnabled`, `showOverlay`, `setButtonEnabled`. Başqa
heç bir context/prop asılılığı yoxdur — bu, komponentin `App.tsx`-də
hər hansı digər provider-dən asılı olmadan mount oluna bilməsini asanlaşdırır
(təkcə `CargoSessionsProvider`-in daxilində olması kifayətdir).
