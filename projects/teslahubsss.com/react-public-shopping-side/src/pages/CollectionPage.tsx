import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/* ─── Types ─── */
interface Product {
  id: number;
  name: string;
  shortName: string;
  img: string;
  price: string;
  originalPrice?: string;
  save?: string;
  from?: boolean;
  category: string;
}

/* ─── Data ─── */
const categoryTabs = [
  'Best Sellers',
  'Noise Reduction',
  'Tech Upgrades',
  'Wheels Protection',
  'Lights',
];

const products: Product[] = [
  { id: 1,  shortName: 'ProGuard\nNoise Reduction Kit',       name: 'TeslaHubs™ ProGuard: Advanced Noise Reduction & Weatherproofing Kit',  img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&q=80', price: '$139.00', originalPrice: '$349.00', save: '$174', from: true, category: 'Noise Reduction' },
  { id: 2,  shortName: 'Space Box\nCarPlay',                  name: 'Teslahubs™ Space Box – CarPlay for Y, 3, S, X, Cybertruck, Juniper',   img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80', price: '$243.00', originalPrice: '$349.00', save: '$276', category: 'Tech Upgrades' },
  { id: 3,  shortName: 'Aluminum Caliper\nCovers',            name: 'Teslahubs™ Aluminium Caliper Covers',                                   img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', price: '$261.00', originalPrice: '$521.00', save: '$260', from: true, category: 'Wheels Protection' },
  { id: 4,  shortName: 'Solar Shield®\nRoof Sunshade',        name: 'Solar Shield® Roof Sunshade Pro Kit',                                   img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80', price: '$243.00', originalPrice: '$321.00', save: '$78',  category: 'Best Sellers' },
  { id: 5,  shortName: 'RGB Dash Light',                      name: 'Teslahubs™ RGB Dash Light',                                             img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80', price: '$70.00',  originalPrice: '$104.00', save: '$35',  category: 'Lights' },
  { id: 6,  shortName: 'Dash Screen\nPRO CarPlay Ultra',      name: 'Dash Screen PRO, CarPlay Ultra',                                        img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&q=80', price: '$417.00', originalPrice: '$677.00', save: '$260', from: true, category: 'Tech Upgrades' },
  { id: 7,  shortName: 'Rear Display\nScreen ULTRA',          name: 'Teslahubs™ Rear Display Screen ULTRA',                                 img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=500&q=80', price: '$434.00', originalPrice: '$694.00', save: '$260', category: 'Tech Upgrades' },
  { id: 8,  shortName: 'ProGuard\nPLUS Version',              name: 'TeslaHubs™ ProGuard Advanced Noise Reduction PLUS Version',             img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&q=80', price: '$139.00', originalPrice: '$347.00', save: '$208', from: true, category: 'Noise Reduction' },
  { id: 9,  shortName: 'ProGuard®\nBlue Edition',             name: 'TeslaHubs™ ProGuard Advanced Noise Reduction Blue Edition',             img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&q=80', price: '$165.00', originalPrice: '$287.00', save: '$122', from: true, category: 'Noise Reduction' },
  { id: 10, shortName: 'Midnight Glow\nProjector Lights',     name: 'Midnight Glow, Tesla Projector Doors Lights',                          img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500&q=80', price: '$52.00',  originalPrice: '$69.00',  save: '$17',  from: true, category: 'Lights' },
  { id: 11, shortName: 'MagSafe\nPhone Holder',               name: 'Teslahubs™ MagSafe Phone Holder',                                      img: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&q=80', price: '$87.00',  originalPrice: '$104.00', save: '$17',  from: true, category: 'Best Sellers' },
  { id: 12, shortName: 'Rim Shield\nProtection Kit',          name: 'Teslahubs™ Rim Shield Advanced Protection Kit',                         img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', price: '$85.00',  from: true, category: 'Wheels Protection' },
  { id: 13, shortName: 'Aluminium\nRim Protectors',           name: 'Teslahubs™ Aluminium Rim Protectors',                                  img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&q=80', price: '$434.00', originalPrice: '$521.00', save: '$87',  category: 'Wheels Protection' },
  { id: 14, shortName: 'Sunroof Seal\nModel 3/Y',             name: 'Teslahubs™ Sunroof Seal Model 3/Y',                                    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80', price: '$52.00',  from: true, category: 'Best Sellers' },
  { id: 15, shortName: 'Interior\nUpgrade Kit',               name: 'Teslahubs™ Interior Upgrade Kit',                                      img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80', price: '$295.00', from: true, category: 'Best Sellers' },
  { id: 16, shortName: 'DashGlow\n360° Vision (BLIS)',         name: 'DashGlow 360° Vision System (BLIS)',                                   img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80', price: '$261.00', originalPrice: '$347.00', save: '$86',  category: 'Lights' },
];

const modelTitles: Record<string, string> = {
  'model-y':    'Model Y',
  'model-3':    'Model 3',
  'model-s':    'Model S',
  'model-x':    'Model X',
  'cybertruck': 'Cybertruck',
  'shop':       'All Models',
  'all-models': 'All Models',
};

/* ─── Sub-components ─── */

function SaveBadge({ amount }: { amount: string }) {
  return (
    <span className="inline-block bg-[#cc0000] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full mt-1">
      SAVE {amount}
    </span>
  );
}

function ProductCard({ p }: { p: Product }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={`/product/${p.id}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#111] mb-3">
        <img
          src={p.img}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Product name overlay */}
        <div className="absolute top-3 left-3 right-3 text-white">
          <p className="font-bold text-sm sm:text-base leading-tight whitespace-pre-line drop-shadow">
            {p.shortName}
          </p>
        </div>
        {/* Hover: view product */}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-[#2563eb] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              View product
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-[#333] leading-snug mb-1 line-clamp-2">{p.name}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[#cc0000] font-bold text-sm">
          {p.from && 'From '}{p.price}
        </span>
        {p.originalPrice && (
          <span className="text-[#aaa] text-xs line-through">{p.originalPrice}</span>
        )}
      </div>
      {p.save && <SaveBadge amount={p.save} />}
    </Link>
  );
}

function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-9 h-9 rounded-full border border-[#ddd] flex items-center justify-center hover:border-[#999] transition-colors"
    >
      {dir === 'left'
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      }
    </button>
  );
}

/* ─── Main Page ─── */
export default function CollectionPage() {
  const location = useLocation();
  const modelId = location.pathname.replace('/', '').split('/')[0] || 'shop';
  const modelLabel = modelTitles[modelId] || 'All Models';

  const [activeTab, setActiveTab] = useState('Best Sellers');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const scrollCarousel = (dir: number) =>
    carouselRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  /* Featured = products matching active tab */
  const featured = products.filter((p) => p.category === activeTab);

  /* All products (filtered) */
  const allFiltered = activeFilters.length > 0
    ? products.filter((p) => activeFilters.includes(p.category))
    : products;

  const displayed = showMore ? allFiltered : allFiltered.slice(0, 8);

  return (
    <div className="bg-white min-h-screen">

      {/* ── Page header ── */}
      <div className="bg-[#111] text-white py-10 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-black mb-2">
          All Products for {modelLabel}
        </h1>
        <p className="text-[#999] text-sm max-w-xl mx-auto">
          Only Teslahubs delivers world-class accessories for {modelLabel}. Trusted, tested, unmatched.
        </p>
      </div>

      {/* ── Main content — centered ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Category tabs ── */}
        <div className="flex items-center gap-2 flex-wrap pt-8 pb-6">
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#2563eb] text-white border-[#2563eb]'
                  : 'bg-white text-[#333] border-[#ddd] hover:border-[#999]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Featured carousel ── */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#999]">
              {activeTab}
            </span>
            <div className="flex gap-2">
              <ArrowBtn dir="left" onClick={() => scrollCarousel(-1)} />
              <ArrowBtn dir="right" onClick={() => scrollCarousel(1)} />
            </div>
          </div>
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {(featured.length > 0 ? featured : products).map((p) => (
              <div key={p.id} className="flex-shrink-0 w-52 sm:w-60">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ── All Products ── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl sm:text-4xl font-black text-[#111]">All Products</h2>
          </div>

          {/* Show filters toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border border-[#ddd] text-[#333] text-sm font-semibold px-4 py-2 rounded-full hover:border-[#999] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Show filters
            </button>

            {/* Filter chips */}
            {showFilters && (
              <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-[#f0f0f0]">
                {categoryTabs.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      activeFilters.includes(f)
                        ? 'bg-[#111] text-white border-[#111]'
                        : 'bg-white text-[#555] border-[#ddd] hover:border-[#999]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
                {activeFilters.length > 0 && (
                  <button
                    onClick={() => setActiveFilters([])}
                    className="text-sm text-[#cc0000] hover:underline px-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayed.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>

          {/* Show more */}
          {!showMore && allFiltered.length > 8 && (
            <div className="text-center mt-10">
              <button
                onClick={() => setShowMore(true)}
                className="border border-[#111] text-[#111] font-semibold px-10 py-3 rounded-full hover:bg-[#111] hover:text-white transition-colors text-sm"
              >
                Show more ({allFiltered.length - 8} more products)
              </button>
            </div>
          )}

          {allFiltered.length === 0 && (
            <div className="text-center py-20 text-[#999]">
              No products match your filter.{' '}
              <button onClick={() => setActiveFilters([])} className="text-[#2563eb] underline">
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* ── SEO content ── */}
        <section className="border-t border-[#f0f0f0] pt-12 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-[#111] mb-2">Interior Enhancements</h3>
            <p className="text-sm text-[#666] leading-relaxed">
              Premium seat covers, floor mats and storage solutions, seamlessly integrated with your {modelLabel}.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#111] mb-2">Exterior Upgrades</h3>
            <p className="text-sm text-[#666] leading-relaxed">
              Aerodynamic enhancements, wheel protection and weather-resistant accessories for your {modelLabel}.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#111] mb-2">Why Shop with Us</h3>
            <p className="text-sm text-[#666] leading-relaxed">
              Every product is tested for quality and engineered for a perfect fit. Trusted by 500,000+ customers.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
