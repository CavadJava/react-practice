export type LessonType = 'theory' | 'exercise' | 'project';

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  content: string;
  // Concrete example content — keeps each lesson from being just a generic
  // description: theory lessons get a short code sample, exercise lessons
  // get a real numbered task list, project lessons get concrete requirements.
  codeExample?: string;
  exercises?: string[];
  exerciseCount?: number;
  projectRequirements?: string[];
};

export type CourseModule = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  price: number;
  rating: number;
  reviewCount: number;
  studentsCount: number;
  // Mock "purchase confirmation" codes — in the real flow the customer pays
  // (WhatsApp request below) and is sent one of these codes, which they then
  // redeem on the course page like a coupon to unlock the curriculum. Kept
  // as a pool (not a single code) since different batches of customers get
  // different codes in practice.
  coupons: string[];
  modules: CourseModule[];
};

type AdvancedCssTopic = { title: string; content: string; codeExample?: string };

const ADVANCED_CSS_TOPICS: AdvancedCssTopic[] = [
  {
    title: 'Kaskad və spesifiklik',
    content: 'Brauzer eyni elementə tətbiq olunan çoxlu qaydadan hansını seçir? Spesifiklik hesablanması (inline > id > class > element) və !important-in təhlükələri.',
    codeExample: '#nav .link { color: red; }   /* spesifiklik: 1 id + 1 class = daha güclü */\n.link { color: blue; }        /* spesifiklik: 1 class = daha zəif, əzilir */',
  },
  {
    title: 'Pseudo-siniflər və pseudo-elementlər',
    content: ':hover, :nth-child(), :not() kimi pseudo-sinifllər və ::before, ::after pseudo-elementləri ilə əlavə HTML olmadan dinamik stillər.',
    codeExample: 'li:nth-child(odd) { background: #f5f5f5; }\np::first-letter { font-size: 2em; }',
  },
  {
    title: 'CSS dəyişənləri (custom properties)',
    content: '--brand-color kimi CSS dəyişənləri ilə təkrarlanan dəyərləri bir yerdə idarə etmək və JavaScript-dən runtime-da dəyişmək.',
    codeExample: ':root { --brand: #8B5CF6; }\n.btn { background: var(--brand); }',
  },
  {
    title: 'Animasiyalar və keyframes',
    content: '@keyframes ilə çoxaddımlı animasiyalar yaratmaq və animation-duration, animation-iteration-count kimi xassələrlə idarə etmək.',
    codeExample: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n.card { animation: fadeIn 0.4s ease-in; }',
  },
  {
    title: 'Transform və transition',
    content: 'transform ilə elementi fırlatmaq/böyütmək/sürüşdürmək, transition ilə bu dəyişiklikləri hamar (smooth) etmək.',
    codeExample: '.card { transition: transform 0.2s; }\n.card:hover { transform: scale(1.05); }',
  },
  {
    title: 'CSS Grid — qabaqcıl yerləşdirmə',
    content: 'grid-template-areas ilə vizual layout təyin etmək, grid-column/grid-row ilə elementləri xüsusi xanalara yerləşdirmək.',
    codeExample: '.layout {\n  display: grid;\n  grid-template-areas: "header header" "sidebar main";\n  grid-template-columns: 200px 1fr;\n}',
  },
  {
    title: 'Flexbox — qabaqcıl ssenarilər',
    content: 'flex-grow, flex-shrink, flex-basis kombinasiyası ilə mürəkkəb responsiv sətirlər, align-self ilə tək elementi fərqli düzləndirmək.',
    codeExample: '.sidebar { flex: 0 0 240px; }\n.content { flex: 1 1 auto; }',
  },
  {
    title: 'Responsive dizayn və media query-lər',
    content: '@media (max-width: 768px) kimi breakpoint-lərlə fərqli ekran ölçülərinə uyğun stillər yazmaq.',
    codeExample: '@media (max-width: 768px) {\n  .grid { grid-template-columns: 1fr; }\n}',
  },
  {
    title: 'Mobile-first yanaşma',
    content: 'Əvvəlcə mobil üçün baza stillər yazıb, sonra min-width media query-lərlə böyük ekranlar üçün əlavələr etmək strategiyası.',
    codeExample: '.card { width: 100%; }\n@media (min-width: 900px) { .card { width: 33%; } }',
  },
  {
    title: 'CSS arxitekturası (BEM)',
    content: 'Block__Element--Modifier adlandırma konvensiyası ilə böyük layihələrdə CSS-i oxunaqlı və toqquşmasız saxlamaq.',
    codeExample: '.card { }\n.card__title { }\n.card--featured { }',
  },
  {
    title: 'CSS Modules əsasları',
    content: 'Komponent-əsaslı layihələrdə CSS class adlarının avtomatik unikallaşdırılması (scoping) ilə qlobal toqquşmaların qarşısını almaq.',
  },
  {
    title: 'Sass/SCSS-ə giriş',
    content: 'Dəyişənlər, nesting, mixin və @use ilə CSS-i daha strukturlu yazmağa imkan verən preprosessor.',
    codeExample: '$brand: #8B5CF6;\n.card { &:hover { border-color: $brand; } }',
  },
  {
    title: 'CSS ilə printing (çap üçün stillər)',
    content: '@media print qaydası ilə səhifə çap olunanda naviqasiya, düymələr kimi elementləri gizlətmək və çap üçün optimallaşdırma.',
    codeExample: '@media print {\n  nav, .no-print { display: none; }\n}',
  },
  {
    title: 'Accessibility (a11y) və CSS',
    content: 'focus-visible ilə klaviatura naviqasiyasını görünən etmək, kontrast nisbətləri və screen-reader-only mətn üçün .sr-only sinifi.',
    codeExample: '.sr-only {\n  position: absolute; width: 1px; height: 1px;\n  overflow: hidden; clip: rect(0,0,0,0);\n}',
  },
  {
    title: 'CSS ilə performans optimallaşdırması',
    content: 'transform/opacity kimi GPU-friendly xassələrdən istifadə, will-change-in düzgün tətbiqi, lazımsız reflow-ların azaldılması.',
  },
  {
    title: 'Dark mode tətbiqi',
    content: 'prefers-color-scheme media query-si və ya class-əsaslı yanaşma ilə açıq/tünd rejimlər arasında keçid.',
    codeExample: '@media (prefers-color-scheme: dark) {\n  body { background: #0E0B1A; color: #fff; }\n}',
  },
  {
    title: 'CSS ilə mikro-interaksiyalar',
    content: 'Düymə basma effektləri, loading spinner-lər və hover animasiyaları ilə istifadəçi təcrübəsini zənginləşdirmək.',
  },
  {
    title: 'CSS filter və blend mode',
    content: 'filter: blur()/brightness() ilə şəkil effektləri, mix-blend-mode ilə təbəqələrin bir-biri ilə vizual qarışdırılması.',
    codeExample: '.overlay { mix-blend-mode: multiply; }\n.thumb { filter: grayscale(1); }',
  },
  {
    title: 'Container queries',
    content: 'Ekran ölçüsü deyil, valideynin (container) ölçüsünə əsasən stil dəyişən müasir responsive texnika.',
    codeExample: '.card-wrap { container-type: inline-size; }\n@container (min-width: 400px) { .card { flex-direction: row; } }',
  },
];

function advancedCssLessons(): Lesson[] {
  const lessons: Lesson[] = ADVANCED_CSS_TOPICS.map((topic, i) => ({
    id: `adv-3-${i + 1}`,
    title: `3.${i + 1} ${topic.title}`,
    type: 'theory',
    duration: '20 dəq',
    content: topic.content,
    codeExample: topic.codeExample,
  }));
  lessons.push({
    id: 'adv-3-20',
    title: '3.20 Məşğələlər — tam responsive layihə',
    type: 'exercise',
    duration: '40 dəq',
    content: 'Bu bölmədə öyrəndiyiniz Advanced CSS mövzularının hamısını birləşdirən 5 praktiki tapşırıq həll edəcəksiniz.',
    exercises: [
      'CSS dəyişənləri ilə rəng palitrası təyin edib bütün layihədə istifadə edin.',
      'Kart komponentinə hover zamanı transform + transition effekti əlavə edin.',
      'CSS Grid ilə grid-template-areas istifadə edən 3 hissəli (header/sidebar/main) səhifə tərtibatı qurun.',
      'Mobile-first yanaşma ilə 2 breakpoint (768px, 1024px) əlavə edin.',
      'prefers-color-scheme ilə dark mode dəstəyi əlavə edin.',
    ],
  });
  return lessons;
}

export const COURSES: Course[] = [
  {
    id: 'html-css-advanced',
    title: 'Html&CSS&AdvancedCss',
    subtitle: 'Sıfırdan qabaqcıl səviyyəyə qədər tam veb-dizayn kursu',
    cover: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=900&q=80',
    price: 49,
    rating: 4.8,
    reviewCount: 312,
    studentsCount: 1840,
    coupons: ['developer','HTMLCSS2024', 'HTMLCSS-VIP', 'WEBSTART10'],
    modules: [
      {
        id: 'html',
        title: '1. Html',
        lessons: [
          {
            id: 'html-1-1',
            title: '1.1 Teoriya',
            type: 'theory',
            duration: '25 dəq',
            content: 'HTML-in əsasları: sənəd strukturu, teqlər, atributlar, DOM ağacının necə formalaşdığı.',
            codeExample: '<!DOCTYPE html>\n<html lang="az">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Mənim səhifəm</title>\n  </head>\n  <body>\n    <h1>Salam!</h1>\n  </body>\n</html>',
          },
          {
            id: 'html-1-2',
            title: '1.2 Semantik HTML',
            type: 'theory',
            duration: '20 dəq',
            content: 'header, main, footer, section, article, nav teqləri və semantik markup-un SEO və əlçatanlığa təsiri.',
            codeExample: '<header>\n  <nav>...</nav>\n</header>\n<main>\n  <article>...</article>\n</main>\n<footer>...</footer>',
          },
          {
            id: 'html-1-3',
            title: '1.3 Məşğələlər',
            type: 'exercise',
            duration: '35 dəq',
            content: 'HTML strukturu qurmaq üzrə 5 praktiki tapşırıq.',
            exercises: [
              'Sadə HTML sənədi yaradın: <!DOCTYPE html>, <head>, <title>, <body> ilə.',
              '<h1>–<h6> başlıqlarından istifadə edərək bir CV strukturu qurun.',
              '<ul>/<ol> ilə bacarıqlarınızın siyahısını hazırlayın.',
              '<a> teqi ilə 3 xarici keçid əlavə edin (target="_blank" ilə).',
              '<img> teqi ilə şəkil əlavə edin, alt atributunu unutmayın.',
            ],
            exerciseCount: 5,
          },
          {
            id: 'html-1-4',
            title: '1.4 Məşğələlər',
            type: 'exercise',
            duration: '35 dəq',
            content: 'Formalar, cədvəllər və semantik teqlərlə bağlı 5 əlavə praktiki tapşırıq.',
            exercises: [
              '<form> yaradın: ad, email, mesaj sahələri ilə.',
              '<table> ilə 5 sətirlik cədvəl hazırlayın (thead/tbody istifadə edərək).',
              '<video> və ya <audio> teqi ilə media faylı əlavə edin.',
              '<fieldset> və <legend> istifadə edərək formu qruplaşdırın.',
              'Bütün form sahələrini <label for=""> ilə əlçatan (accessible) edin.',
            ],
            exerciseCount: 5,
          },
          {
            id: 'html-1-5',
            title: '1.5 Modul layihəsi',
            type: 'project',
            duration: '60 dəq',
            content: 'Öyrəndiyiniz HTML biliklərini istifadə edərək sadə bir bio-səhifə hazırlayın.',
            projectRequirements: [
              'Semantik teqlərdən istifadə edin (header, nav, main, footer).',
              'Ən azı 3 bölmə olsun: haqqımda, bacarıqlar, əlaqə.',
              'Bir əlaqə forması əlavə edin (ad, email, mesaj).',
              'Bütün şəkillərdə alt atributu olsun.',
            ],
          },
        ],
      },
      {
        id: 'css',
        title: '2. CSS',
        lessons: [
          {
            id: 'css-2-1',
            title: '2.1 Teoriya',
            type: 'theory',
            duration: '25 dəq',
            content: 'CSS seçiciləri, box model, ölçü vahidləri (px, %, em, rem, vh/vw).',
            codeExample: '.box {\n  width: 200px;\n  padding: 16px;\n  border: 1px solid #ccc;\n  margin: 8px;\n}',
          },
          {
            id: 'css-2-2',
            title: '2.2 Flexbox və Grid',
            type: 'theory',
            duration: '30 dəq',
            content: 'Flexbox və CSS Grid ilə müasir yerləşdirmə (layout) texnikaları.',
            codeExample: '.row {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}',
          },
          {
            id: 'css-2-3',
            title: '2.3 Məşğələlər',
            type: 'exercise',
            duration: '35 dəq',
            content: 'Flexbox/Grid istifadə edərək 5 layout tapşırığı.',
            exercises: [
              '3 kartlıq flex sətri qurun (justify-content: space-between ilə).',
              'CSS Grid ilə 2 sütunlu səhifə tərtibatı yaradın.',
              ':hover effekti olan bir düymə hazırlayın.',
              'Flexbox ilə tam mərkəzləşdirilmiş modal pəncərəsi qurun.',
              'Media query ilə responsiv naviqasiya paneli hazırlayın.',
            ],
            exerciseCount: 5,
          },
        ],
      },
      {
        id: 'advanced-css',
        title: '3. AdvancedCSS',
        lessons: advancedCssLessons(),
      },
      {
        id: 'final',
        title: 'Final',
        lessons: [
          {
            id: 'final-project',
            title: 'Final layihə',
            type: 'project',
            duration: '120 dəq',
            content: 'Kursda öyrəndiyiniz bütün HTML və CSS biliklərini istifadə edərək tam funksional, responsive bir veb-sayt hazırlayın.',
            projectRequirements: [
              'Ən azı 4 səhifə/bölmə (Ana səhifə, Haqqımızda, Xidmətlər, Əlaqə).',
              'Semantik HTML strukturu və əlçatan (a11y) formalar.',
              'CSS Grid və Flexbox-un hər ikisindən istifadə.',
              'Mobile-first responsive dizayn (ən azı 2 breakpoint).',
              'CSS dəyişənləri ilə vahid rəng/tipoqrafiya sistemi.',
              'Dark mode dəstəyi (prefers-color-scheme).',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'design-patterns',
    title: 'Design Pattern',
    subtitle: 'Creational, Structural və Behavioral dizayn şablonları',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80',
    price: 69,
    rating: 4.9,
    reviewCount: 198,
    studentsCount: 940,
    coupons: ['developer','PATTERNS2024', 'PATTERNS-VIP', 'DEVUP15'],
    modules: [
      {
        id: 'intro',
        title: '1. Giriş',
        lessons: [
          {
            id: 'intro-1-1',
            title: '1.1 Dizayn Pattern nədir?',
            type: 'theory',
            duration: '20 dəq',
            content:
              'Dizayn şablonu — tez-tez rastlanan proqramlaşdırma problemlərinin sınaqdan keçmiş, təkrar istifadə oluna bilən həll yoludur. Kod deyil, konsepsiyadır: eyni şablonu istənilən dildə fərqli şəkildə tətbiq etmək olar.',
          },
          {
            id: 'intro-1-2',
            title: '1.2 SOLID prinsipləri',
            type: 'theory',
            duration: '30 dəq',
            content:
              'S — Single Responsibility (hər sinif bir vəzifəyə cavabdehdir); O — Open/Closed (genişlənməyə açıq, dəyişikliyə qapalı); L — Liskov Substitution (alt sinif valideynini əvəz edə bilməlidir); I — Interface Segregation (kiçik, spesifik interfeyslər); D — Dependency Inversion (konkret sinif deyil, abstraksiyadan asılı olmaq). Əksər dizayn şablonları bu prinsipləri tətbiq etməyin konkret yollarıdır.',
          },
        ],
      },
      {
        id: 'creational',
        title: '2. Creational Patterns',
        lessons: [
          {
            id: 'cr-2-1',
            title: '2.1 Singleton',
            type: 'theory',
            duration: '20 dəq',
            content: 'Sinifin yalnız bir instansının olmasını təmin edir və ona qlobal giriş nöqtəsi verir (məs. tək bir konfiqurasiya obyekti).',
            codeExample: 'class Config {\n  static #instance;\n  static getInstance() {\n    if (!Config.#instance) Config.#instance = new Config();\n    return Config.#instance;\n  }\n}',
          },
          {
            id: 'cr-2-2',
            title: '2.2 Factory Method',
            type: 'theory',
            duration: '25 dəq',
            content: 'Obyekt yaratma məntiqini bir metoda köçürür ki, hansı sinifin instansiyalaşdırılacağını alt siniflər müəyyən etsin.',
            codeExample: 'function createButton(type) {\n  if (type === "ios") return new IOSButton();\n  return new AndroidButton();\n}',
          },
          {
            id: 'cr-2-3',
            title: '2.3 Builder',
            type: 'theory',
            duration: '20 dəq',
            content: 'Mürəkkəb bir obyekti addım-addım, oxunaqlı şəkildə qurmağa imkan verir (çoxlu konstruktor parametrindən qaçmaq üçün).',
            codeExample: 'new PizzaBuilder().setSize("large").addTopping("olives").addTopping("cheese").build();',
          },
          {
            id: 'cr-2-4',
            title: '2.4 Məşğələlər',
            type: 'exercise',
            duration: '35 dəq',
            content: 'Creational patterns üzrə 5 praktiki tapşırıq.',
            exercises: [
              'Tətbiqin bütün loglarını idarə edən Singleton Logger sinifi yazın.',
              'Nəqliyyat vasitəsi (Car, Bike, Truck) yaradan Factory Method funksiyası yazın.',
              'İstifadəçi profili qurmaq üçün Builder sinifi yazın (ad, email, ixtiyari sahələr).',
              'Fərqli ödəniş üsulları (Card, Cash) üçün fabrika funksiyası yazın.',
              'Singleton-un test zamanı yaratdığı problemi izah edən qısa qeyd yazın.',
            ],
            exerciseCount: 5,
          },
        ],
      },
      {
        id: 'structural',
        title: '3. Structural Patterns',
        lessons: [
          {
            id: 'st-3-1',
            title: '3.1 Adapter',
            type: 'theory',
            duration: '20 dəq',
            content: 'Uyğunsuz interfeysli iki sinifi bir-biri ilə işləməyə imkan verən "adapter" (çevirici) təbəqə yaradır.',
            codeExample: 'class EuroToUsdAdapter {\n  constructor(euroApi) { this.euroApi = euroApi; }\n  getUsd() { return this.euroApi.getEuro() * 1.1; }\n}',
          },
          {
            id: 'st-3-2',
            title: '3.2 Decorator',
            type: 'theory',
            duration: '20 dəq',
            content: 'Mövcud obyektə, onun sinifini dəyişmədən, dinamik şəkildə yeni funksionallıq "sarıyır".',
            codeExample: 'function withLogging(fn) {\n  return (...args) => { console.log("call", args); return fn(...args); };\n}',
          },
          {
            id: 'st-3-3',
            title: '3.3 Facade',
            type: 'theory',
            duration: '20 dəq',
            content: 'Mürəkkəb alt-sistemlərin arxasında sadə, vahid bir interfeys təqdim edir.',
            codeExample: 'class OrderFacade {\n  placeOrder(cart) {\n    Payment.charge(cart); Inventory.reserve(cart); Shipping.schedule(cart);\n  }\n}',
          },
          {
            id: 'st-3-4',
            title: '3.4 Məşğələlər',
            type: 'exercise',
            duration: '35 dəq',
            content: 'Structural patterns üzrə 5 praktiki tapşırıq.',
            exercises: [
              'Köhnə API-ni yeni interfeysə uyğunlaşdıran Adapter sinifi yazın.',
              'Qəhvə sifarişinə süd/şəkər əlavə edən Decorator zənciri yazın.',
              '3 alt-sistemi (ödəniş, inventar, çatdırılma) birləşdirən Facade sinifi yazın.',
              'Faylların ağac strukturunu təmsil edən Composite pattern nümunəsi yazın.',
              'Decorator ilə Inheritance arasındakı fərqi izah edən qısa qeyd yazın.',
            ],
            exerciseCount: 5,
          },
        ],
      },
      {
        id: 'behavioral',
        title: '4. Behavioral Patterns',
        lessons: [
          {
            id: 'be-4-1',
            title: '4.1 Observer',
            type: 'theory',
            duration: '20 dəq',
            content: 'Bir obyektin vəziyyəti dəyişdikdə, ona "abunə olmuş" bütün digər obyektlərə avtomatik xəbər ötürülür.',
            codeExample: 'class EventBus {\n  #listeners = [];\n  subscribe(fn) { this.#listeners.push(fn); }\n  emit(data) { this.#listeners.forEach(fn => fn(data)); }\n}',
          },
          {
            id: 'be-4-2',
            title: '4.2 Strategy',
            type: 'theory',
            duration: '20 dəq',
            content: 'Alqoritmləri ayrı siniflərə çıxarıb, onları runtime-da bir-biri ilə əvəz etməyə imkan verir.',
            codeExample: 'const strategies = { card: payWithCard, cash: payWithCash };\nstrategies[method](amount);',
          },
          {
            id: 'be-4-3',
            title: '4.3 Command',
            type: 'theory',
            duration: '20 dəq',
            content: 'Bir sorğunu (əməliyyatı) obyekt kimi kapsullaşdırır — undo/redo və növbəyə salma kimi funksiyaları asanlaşdırır.',
            codeExample: 'class AddItemCommand {\n  constructor(cart, item) { this.cart = cart; this.item = item; }\n  execute() { this.cart.add(this.item); }\n  undo() { this.cart.remove(this.item); }\n}',
          },
          {
            id: 'be-4-4',
            title: '4.4 Məşğələlər',
            type: 'exercise',
            duration: '35 dəq',
            content: 'Behavioral patterns üzrə 5 praktiki tapşırıq.',
            exercises: [
              'Səbətə məhsul əlavə olunanda xəbərdarlıq göndərən Observer sistemi yazın.',
              'Fərqli sıralama alqoritmləri (ada görə, qiymətə görə) üçün Strategy pattern yazın.',
              'Undo dəstəkləyən bir Command sinifi yazın (məs. mətn redaktoru üçün).',
              'Sadə bir State pattern nümunəsi yazın (sifariş statusu: gözləyir → təsdiqlənib → çatdırılıb).',
              'Observer ilə PubSub arasındakı fərqi izah edən qısa qeyd yazın.',
            ],
            exerciseCount: 5,
          },
        ],
      },
      {
        id: 'final',
        title: 'Final',
        lessons: [
          {
            id: 'final-project',
            title: 'Final layihə',
            type: 'project',
            duration: '90 dəq',
            content: 'Öyrəndiyiniz dizayn şablonlarından ən azı 4-nü istifadə edərək kiçik bir tətbiq arxitekturası qurun.',
            projectRequirements: [
              'Ən azı 1 Creational pattern istifadə edin (Singleton/Factory/Builder).',
              'Ən azı 1 Structural pattern istifadə edin (Adapter/Decorator/Facade).',
              'Ən azı 1 Behavioral pattern istifadə edin (Observer/Strategy/Command).',
              'Hər şablonun niyə seçildiyini izah edən qısa sənədləşdirmə yazın.',
              'Kodu real bir ssenariyə tətbiq edin (məs. sadə e-ticarət səbəti).',
            ],
          },
        ],
      },
    ],
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find(c => c.id === id);
}

export function isValidCoupon(course: Course, code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return course.coupons.some(c => c.toUpperCase() === normalized);
}

export type FlattenedLesson = {
  lesson: Lesson;
  moduleId: string;
  moduleTitle: string;
  index: number;
};

// Every lesson across every module, in curriculum order — this is the
// strict chain: lesson at index i can only be started once the lesson at
// index i-1 is completed, regardless of which module it's in (so you can't
// jump from 1.2 to 1.4, or from 1.4 straight into module 2).
export function getFlattenedLessons(course: Course): FlattenedLesson[] {
  const result: FlattenedLesson[] = [];
  let index = 0;
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      result.push({ lesson, moduleId: module.id, moduleTitle: module.title, index });
      index += 1;
    }
  }
  return result;
}

export function getLessonPosition(course: Course, lessonId: string): number {
  return getFlattenedLessons(course).findIndex(f => f.lesson.id === lessonId);
}

export function getFlattenedLesson(course: Course, lessonId: string): FlattenedLesson | undefined {
  return getFlattenedLessons(course).find(f => f.lesson.id === lessonId);
}

export function getNextLesson(course: Course, lessonId: string): FlattenedLesson | undefined {
  const flat = getFlattenedLessons(course);
  const pos = flat.findIndex(f => f.lesson.id === lessonId);
  if (pos === -1) return undefined;
  return flat[pos + 1];
}
