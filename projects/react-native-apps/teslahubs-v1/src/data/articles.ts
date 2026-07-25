export enum ArticleCategory {
  Tips = 'tips',
  Maintenance = 'maintenance',
  Guides = 'guides',
  News = 'news',
}

export type ArticleCategoryInfo = {
  key: ArticleCategory;
  name: string;
};

export type Article = {
  id: string;
  title: string;
  category: ArticleCategory;
  image: string;
  author: string;
  date: string;
  readMinutes: number;
  excerpt: string;
  content: string[];
};

export const ARTICLE_CATEGORIES: ArticleCategoryInfo[] = [
  { key: ArticleCategory.Tips, name: 'Məsləhətlər' },
  { key: ArticleCategory.Maintenance, name: 'Baxım' },
  { key: ArticleCategory.Guides, name: 'Bələdçilər' },
  { key: ArticleCategory.News, name: 'Xəbərlər' },
];

export const ARTICLES: Article[] = [
  {
    id: 'art1',
    title: 'Tesla sahibləri üçün 5 vacib aksesuar məsləhəti',
    category: ArticleCategory.Tips,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80',
    author: 'Teslahubs',
    date: '2026-07-18',
    readMinutes: 4,
    excerpt:
      'Tesla-nızın həm görünüşünü, həm də rahatlığını artıran, quraşdırılması asan 5 aksesuar — hansına ilk növbədə sərmayə qoymalısınız?',
    content: [
      'Tesla sahibliyi təkcə sürücülük təcrübəsi ilə bitmir — düzgün aksesuarlarla avtomobilinizin həm ömrünü uzada, həm də gündəlik istifadəsini xeyli rahatlaşdıra bilərsiniz. Aşağıda ən çox tövsiyə olunan beş aksesuarı topladıq.',
      '1. Günəş kölgəliyi (Sunshade). Şüşə tavanlı modellərdə yay aylarında salon temperaturu sürətlə qalxır. Keyfiyyətli bir günəş kölgəliyi UV şüalarının 99%-ə qədərini bloklayır və konditisionerin daha az işləməsinə şərait yaradır.',
      '2. Səs-küy izolyasiyası dəstləri. Zavod möhürləri zamanla aşınır. Əlavə rezin izolyasiya küçə səs-küyünü azaldır və salonu daha sakit edir — xüsusilə uzun məsafəli səyahətlərdə fərq hiss olunur.',
      '3. Alüminium kaliper qapaqları. Həm estetik, həm də qoruyucu funksiya daşıyır — əyləc tozundan və korroziyadan qoruyur, quraşdırılması üçün əyləc sisteminin sökülməsinə ehtiyac yoxdur.',
      '4. Hava şəraitinə davamlı ayaq döşəmələri. Bakı-nın dəyişkən hava şəraitində salonu təmiz saxlamağın ən sadə yolu. Palçıq və nəmi tutaraq orijinal döşəməni qoruyur.',
      '5. İkiqat simsiz enerji dolum paneli. Mərkəzi konsol bölməsinə tam oturaraq, həm sürücü, həm sərnişin üçün eyni anda sürətli enerji dolumu təmin edir.',
      'Bu aksesuarların hamısını Teslahubs kataloqunda tapa, öz Model 3 və ya Model Y-nizə uyğun variantı seçə bilərsiniz.',
    ],
  },
];

export function getArticleCategoryName(key: ArticleCategory): string {
  return ARTICLE_CATEGORIES.find(c => c.key === key)?.name ?? key;
}
