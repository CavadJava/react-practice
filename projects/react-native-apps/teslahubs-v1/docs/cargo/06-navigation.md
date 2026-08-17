# Naviqasiya — `CargoStackNavigator.tsx` + `navigation/types.ts`

`#navigation` `#react-navigation`

## `CargoStackNavigator.tsx`

```tsx
const Stack = createNativeStackNavigator<CargoStackParamList>();

export default function CargoStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Cargo" component={CargoScreen} />
    </Stack.Navigator>
  );
}
```

Bu, əslində **bir tək ekranlıq** stack-dir — içində yalnız `CargoScreen`
var. Niyə tam bir `Stack.Navigator` sarınıb, sadəcə `CargoScreen`-i birbaşa
render etmək əvəzinə? Çünki tətbiqin ümumi naviqasiya konvensiyası budur:
hər "mini-app modulu" (AvtoYuma, Tesla Service, Doctors, Restaurants,
Courses, Cargo) `RootStackParamList`-də öz `XStackNavigator`-u ilə
qeydiyyatdan keçir, `fullScreenModal` kimi açılır — Cargo bunun sadəcə
ən sadə (bir ekranlı) nümunəsidir. Gələcəkdə Kargo daxilində ikinci bir
ekran (məs. "Sifariş tarixçəsi") əlavə etmək istəsəniz, bu strukturun
üzərinə `<Stack.Screen name="CargoHistory" .../>` əlavə etmək kifayətdir —
yeni bir tam-modul yaratmağa ehtiyac yoxdur.

`headerShown: false` — çünki `CargoScreen` öz header-ini özü çəkir (bax
[07-cargo-screen.md](07-cargo-screen.md), `styles.header`).

## `RootNavigator`-a qoşulma

`RootNavigator.tsx`-də (bu sənədin əhatə etmədiyi fayl, amma referans üçün):

```tsx
<Stack.Screen name="Cargo" component={CargoStackNavigator} options={{ presentation: 'fullScreenModal' }} />
```

`presentation: 'fullScreenModal'` — Kargo modulu aşağıdan yuxarı açılan tam
ekranlı modal kimi görünür, "✕" düyməsi ilə bağlanır
(`navigation.getParent()?.goBack()` — `CargoScreen`-in özündəki, `Stack`-in
"parent"-i olan `RootNavigator`-a müraciət edir, çünki `CargoScreen`
`CargoStackNavigator`-ın **daxilindədir**, iki səviyyə fərqlidir).

## `types.ts` — tip tərifləri

```ts
export type CargoStackParamList = {
  Cargo: undefined;
};
```

`undefined` — bu ekran heç bir naviqasiya parametri qəbul etmir (məs.
`CourseDetail: { courseId: string }`-dən fərqli olaraq).

`RootStackParamList`-də:

```ts
export type RootStackParamList = {
  // ...
  Cargo: NavigatorScreenParams<CargoStackParamList> | undefined;
  // ...
};
```

`NavigatorScreenParams<CargoStackParamList>` — bu, "Cargo" root-level
route-una naviqasiya edərkən, daxildəki stack-in öz route/parametrlərini də
ötürə bilmək üçündür (məs. `navigation.navigate('Cargo', { screen: 'Cargo' })`)
— hazırda praktikada sadə `navigation.navigate('Cargo')` kifayət edir, çünki
daxildə tək ekran var.

## `CargoScreen`-in `Props` tipi

```ts
type Props = CompositeScreenProps<
  NativeStackScreenProps<CargoStackParamList, 'Cargo'>,
  NativeStackScreenProps<RootStackParamList>
>;
```

`CompositeScreenProps` iki səviyyəli naviqasiya tipini birləşdirir:

- Birinci arqument — `CargoScreen`-in **öz** stack-indəki (`CargoStackNavigator`) tipi.
- İkinci arqument — **valideyn** stack-in (`RootNavigator`) tipi.

Bu sayədə `navigation.getParent()` çağırışı TypeScript tərəfindən düzgün
tanınır — `getParent()`-in geri qaytardığı obyektin `RootStackParamList`
üzrə `goBack()`/`navigate()` metodları olduğu bilinir.

`#gotcha`: Yeni bir mini-modul yaradanda (Cargo-ya bənzər) bu iki-səviyyəli
`CompositeScreenProps` pattern-ini kopyalamağı unutmayın — əks halda
`navigation.getParent()?.goBack()` tipli çağırışlar TypeScript tərəfindən
`any` kimi görünəcək (səssiz, aşkarlanması çətin bug mənbəyi).
