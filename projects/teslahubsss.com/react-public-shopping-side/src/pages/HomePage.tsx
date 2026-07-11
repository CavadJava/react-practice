import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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
  badge?: string;
}

interface Review {
  title: string;
  text: string;
  author: string;
  date: string;
}

/* ─── Data ─── */
const models = [
  { label: 'Model Y',    to: '/model-y',    img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=700&q=80' },
  { label: 'Model 3',    to: '/model-3',    img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=700&q=80' },
  { label: 'Model S',    to: '/model-s',    img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=700&q=80' },
  { label: 'Model X',    to: '/model-x',    img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=700&q=80' },
  { label: 'Cybertruck', to: '/cybertruck', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=700&q=80' },
];

const bestSellers: Product[] = [
  { id: 1, shortName: 'Solar Shield®\nRoof Sunshade', name: 'Solar Shield® Roof Sunshade Pro Kit', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&q=80', price: '$139.99', originalPrice: '$185.00', save: '$45', badge: 'NASA-grade thermal barrier' },
  { id: 2, shortName: 'Aluminum Caliper\nCovers', name: 'Teslahubs™ Aluminium Caliper Covers', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', price: '$149.99', originalPrice: '$300.00', save: '$150', from: true },
  { id: 3, shortName: 'DashGlow\n360° Vision System', name: 'DashGlow 360° Vision System (BLIS)', img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80', price: '$149.99', originalPrice: '$199.99', save: '$50' },
  { id: 4, shortName: 'Dash Screen\nPRO', name: 'Dash Screen PRO, CarPlay Ultra', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&q=80', price: '$239.99', originalPrice: '$389.99', save: '$150', from: true },
  { id: 5, shortName: 'Rear Display\nScreen ULTRA', name: 'Teslahubs™ Rear Display Screen ULTRA', img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&q=80', price: '$249.99', originalPrice: '$399.99', save: '$150' },
  { id: 6, shortName: 'MagSafe\nPhone Holder', name: 'Teslahubs™ MagSafe Phone Holder', img: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&q=80', price: '$49.99', originalPrice: '$59.99', save: '$10', from: true },
  { id: 7, shortName: 'Midnight Glow\nProjector Lights', name: 'Midnight Glow, Tesla Projector Doors Lights', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80', price: '$29.99', originalPrice: '$39.99', save: '$10', from: true },
  { id: 8, shortName: 'AeroShield\nWindow Visors', name: 'AeroShield Window Visors', img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500&q=80', price: '$169.99' },
];

const reviews: Review[] = [
  { title: 'The kit looks like good quality', text: 'The kit looks like good quality. Have not fitted it yet waiting for my son to arrive on holiday and he will fit the two kit one on my Tesla Y and the other on his Tesla Y.', author: 'bernard curnow', date: 'Jun 18, 2026' },
  { title: 'Product arrived as described', text: 'Product arrived as described, better material by far than the $39.00 cheap kits sold online. Rubber feels and works as the OEM installed seals. Cars is about 8DB quieter on the road, and noise does not leave the car nearly as easily.', author: 'Robert', date: 'Jun 18, 2026' },
  { title: 'Ordering was quick and easy', text: 'Ordering was quick and easy and I found everything I needed at a reasonable price. Items arrived well packaged and in good time. Haven\'t fitted yet, but items look good quality and are sure to fit well.', author: 'geoff nevard', date: 'Jun 19, 2026' },
  { title: 'ProGuard noise reduction', text: 'Great product, delivery service was fast. Definitely recommend to any Tesla owner looking to reduce road noise.', author: 'Stephan Goppel', date: 'Jun 30, 2026' },
  { title: 'Fantastic fit and works perfectly', text: 'Fantastic fit and works perfectly. Installation was straightforward. Very happy with the purchase.', author: 'Damien Simpson', date: 'Jul 1, 2026' },
  { title: 'Perfect Floor Mats', text: 'Perfect floor mats! Fits like a glove and looks premium in the car. Great quality for the price.', author: 'Mark H', date: 'Jun 17, 2026' },
];

const proGuardModels = ['Juniper', 'Model Y', 'Model 3', 'Model 3 (2025)', 'Model S', 'Model X', 'Cybertruck'];

/* ─── Helper Components ─── */

function GreenStars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < count ? 'text-[#22c55e]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-600 hover:bg-gray-50 transition-all text-gray-600"
      aria-label={dir}
    >
      {dir === 'left' ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

function BluePillButton({ children, to, onClick }: { children: React.ReactNode; to?: string; onClick?: () => void }) {
  const cls = 'inline-flex items-center justify-center bg-[#2563eb] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#1d4ed8] transition-colors text-sm';
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

/* ─── Product Card for Best Sellers ─── */
function ProductCard({ p }: { p: Product }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex-shrink-0 w-56 sm:w-64"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 group">
        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
        {/* Text on image */}
        <div className="absolute top-4 left-4 right-4 text-white">
          <p className="font-bold text-sm sm:text-base leading-tight whitespace-pre-line">
            {p.shortName}
          </p>
          {p.badge && (
            <span className="inline-block mt-1.5 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
              {p.badge}
            </span>
          )}
        </div>
        {/* View product on hover */}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              to={`/product/${p.id}`}
              className="bg-[#2563eb] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#1d4ed8] transition-colors"
            >
              View product
            </Link>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-[#333] mb-1.5 leading-tight line-clamp-2">{p.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#cc0000] font-bold text-sm">
            {p.from && 'From '}{p.price}
          </span>
          {p.originalPrice && (
            <span className="text-[#999] text-xs line-through">{p.originalPrice}</span>
          )}
        </div>
        {p.save && (
          <span className="inline-block mt-1.5 bg-[#7f1d1d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            SAVE {p.save}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const modelRef = useRef<HTMLDivElement>(null);
  const sellerRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState('Juniper');

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: number) => {
    ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center text-white overflow-hidden"
        style={{
          minHeight: '88vh',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0000 60%, #0a0a0a 100%)',
        }}
      >
        {/* Background car image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1920&q=80)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

        <div className="relative z-10 flex flex-col items-center px-4">
          <p className="text-lg sm:text-xl font-light mb-3 tracking-wide">Tesla Birthday Sale</p>

          {/* Oval border around 65% OFF */}
          <div className="relative inline-flex items-center justify-center mb-6 px-14 py-3">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 300 90"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="150" cy="45" rx="145" ry="40" fill="none" stroke="#cc0000" strokeWidth="4" />
            </svg>
            <span className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
              UP TO 65% OFF
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              to="/sale"
              className="bg-[#2563eb] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#1d4ed8] transition-colors text-sm"
            >
              Claim 65% Off
            </Link>
            <Link
              to="/shop"
              className="bg-black/50 backdrop-blur-sm border border-white/40 text-white font-bold px-8 py-3.5 rounded-full hover:bg-black/70 transition-colors text-sm"
            >
              See More
            </Link>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2">
            <GreenStars />
            <span className="text-sm text-white/90">Rated 4.9/5 by 500,000+ customers</span>
          </div>
        </div>
      </section>

      {/* ── ASK TESLA CONCIERGE ── */}
      <section className="bg-white py-6">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center gap-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-full px-5 py-3">
            <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input
              type="text"
              placeholder="Ask Tesla Concierge"
              className="flex-1 bg-transparent text-sm text-[#333] outline-none placeholder-[#999]"
            />
            <button className="text-[#999] hover:text-[#333] transition-colors" aria-label="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── CHOOSE YOUR MODEL ── */}
      <section className="bg-white pb-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-start justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-[#111]">
              Choose your{' '}
              <span
                className="italic"
                style={{
                  textDecoration: 'underline',
                  textDecorationStyle: 'wavy',
                  textDecorationColor: '#cc0000',
                  textUnderlineOffset: '6px',
                }}
              >
                model
              </span>
              ...
            </h2>
            <div className="flex gap-2 mt-1">
              <ArrowBtn dir="left" onClick={() => scrollCarousel(modelRef, -1)} />
              <ArrowBtn dir="right" onClick={() => scrollCarousel(modelRef, 1)} />
            </div>
          </div>

          <div
            ref={modelRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {models.map((m) => (
              <Link
                key={m.label}
                to={m.to}
                className="flex-shrink-0 relative group rounded-2xl overflow-hidden"
                style={{ width: 280, height: 320 }}
              >
                <img
                  src={m.img}
                  alt={m.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {/* label */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                  <span className="font-bold text-xl drop-shadow">{m.label}</span>
                  <span className="text-2xl group-hover:translate-x-1 transition-transform drop-shadow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section id="best-sellers" className="bg-white pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-start justify-between mb-8">
            <h2 className="text-4xl sm:text-5xl font-black text-[#111]">Best sellers</h2>
            <div className="flex gap-2 mt-2">
              <ArrowBtn dir="left" onClick={() => scrollCarousel(sellerRef, -1)} />
              <ArrowBtn dir="right" onClick={() => scrollCarousel(sellerRef, 1)} />
            </div>
          </div>

          <div
            ref={sellerRef}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {bestSellers.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="bg-white pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-start justify-between mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-[#111]">Loved by 100,000+ customers</h2>
            <div className="flex gap-2 mt-2">
              <ArrowBtn dir="left" onClick={() => scrollCarousel(reviewRef, -1)} />
              <ArrowBtn dir="right" onClick={() => scrollCarousel(reviewRef, 1)} />
            </div>
          </div>

          <div
            ref={reviewRef}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {reviews.map((r) => (
              <div
                key={r.author + r.date}
                className="flex-shrink-0 w-72 sm:w-80 border border-[#e5e5e5] rounded-2xl p-6 bg-white"
              >
                <GreenStars />
                <p className="font-bold text-[#111] mt-3 mb-2">{r.title}</p>
                <p className="text-sm text-[#555] leading-relaxed mb-4">{r.text}</p>
                <p className="text-xs text-[#999] italic">{r.author}, {r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCT ── */}
      <section className="bg-white pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: image gallery */}
            <div>
              <div className="rounded-2xl overflow-hidden mb-3 aspect-[4/3] bg-[#f5f5f5]">
                <img
                  src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80"
                  alt="ProGuard Kit"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {[
                  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=200&q=80',
                  'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=200&q=80',
                  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=80',
                  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&q=80',
                  'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=200&q=80',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="flex-shrink-0 w-16 h-16 rounded-lg object-cover border-2 border-transparent hover:border-[#2563eb] cursor-pointer transition-colors"
                  />
                ))}
                <div className="flex-shrink-0 w-8 flex items-center">
                  <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right: product info */}
            <div>
              <div className="flex items-start gap-4 mb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-[#111] flex-1 leading-snug">
                  TeslaHubs™ ProGuard: Advanced Noise Reduction & Weatherproofing Kit Blue Edition
                </h2>
                <div className="shrink-0 text-right">
                  <div className="text-[#cc0000] font-black text-xl">$124.99</div>
                  <div className="text-[#999] text-sm line-through">$179.99</div>
                  <span className="inline-block mt-1 bg-[#7f1d1d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    SAVE $55
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#555] mb-4">
                <span className="font-semibold text-[#111]">Model:</span> {selectedModel}
              </p>

              {/* Model selector pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {proGuardModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      selectedModel === m
                        ? 'border-[#111] bg-[#111] text-white'
                        : 'border-[#ddd] text-[#333] hover:border-[#999]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Add to cart */}
              <button className="w-full bg-[#2563eb] text-white font-bold py-4 rounded-full hover:bg-[#1d4ed8] transition-colors mb-4 text-sm">
                Add to cart
              </button>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <defs>
                      <linearGradient id="half">
                        <stop offset="52%" stopColor="#facc15" />
                        <stop offset="52%" stopColor="#e5e7eb" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#111]">4.52</span>
                <span className="text-sm text-[#999]">1025 reviews</span>
              </div>

              {/* View full details */}
              <Link
                to="/product/proguard"
                className="flex items-center justify-between text-sm font-medium text-[#111] py-3 border-t border-[#e5e5e5] hover:text-[#2563eb] transition-colors"
              >
                <span>View full details</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── T-HUBS WEEKLY (full-width banner) ── */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: '50vh',
          background: 'url(https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80) no-repeat center center / cover',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-16 py-16 flex flex-col justify-between h-full" style={{ minHeight: '50vh' }}>
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 max-w-lg leading-tight">
              <span className="font-black">T-HUBS</span>{' '}
              <span className="font-light">Weekly</span>
            </h2>
            <p className="text-white/85 text-base max-w-sm mb-8">
              Everything that happened in the Tesla world this week in 5 minutes.
            </p>
            <Link
              to="/digest"
              className="inline-flex items-center gap-2 bg-white text-[#111] font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors text-sm"
            >
              See More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <div className="mt-10">
            <div className="flex -space-x-2 mb-2">
              {[
                'https://i.pravatar.cc/40?img=1',
                'https://i.pravatar.cc/40?img=2',
                'https://i.pravatar.cc/40?img=3',
                'https://i.pravatar.cc/40?img=4',
                'https://i.pravatar.cc/40?img=5',
                'https://i.pravatar.cc/40?img=6',
                'https://i.pravatar.cc/40?img=7',
                'https://i.pravatar.cc/40?img=8',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <p className="text-white/80 text-sm">Top owners, engineers & enthusiasts every week</p>
          </div>
        </div>
      </section>

      {/* ── TESLA DIGEST ── */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: '55vh',
          background: 'url(https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1920&q=80) no-repeat right center / cover',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/20" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-16 flex items-end pb-16" style={{ minHeight: '55vh' }}>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#c8c8c8] uppercase mb-4">Tesla Digest</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-8 max-w-xl leading-tight">
              Is Tesla's FSD Worth It In 2026? The Real Story
            </h2>
            <div className="flex items-center gap-4">
              <BluePillButton to="/digest">Read more</BluePillButton>
              <Link
                to="/digest"
                className="text-white text-sm font-medium hover:underline flex items-center gap-1.5"
              >
                Go to Digest
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT TESLAHUBS ── */}
      <section className="bg-white py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center lg:justify-start">
              <img
                src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80"
                alt="Teslahubs building"
                className="rounded-2xl w-full max-w-lg object-cover shadow-sm"
                style={{ aspectRatio: '4/3' }}
              />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#111] mb-5">About Teslahubs</h2>
              <p className="text-[#555] text-base leading-relaxed mb-8">
                Teslahubs is your premier destination for high-quality Tesla accessories, designed to enhance your ownership
                experience. With four years of dedicated commitment to Tesla enthusiasts, we've become a trusted name in the
                community, offering an array of accessories that blend style and functionality seamlessly.
              </p>
              <BluePillButton to="/about">
                Our Story
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </BluePillButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE OUR ACCESSORIES ── */}
      <section className="bg-white pb-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Black pill header */}
          <div className="flex justify-start mb-8">
            <div className="bg-[#111] text-white font-bold text-xl sm:text-2xl px-8 py-4 rounded-full">
              Why Choose Our Accessories?
            </div>
          </div>

          <p className="text-[#555] text-base leading-relaxed mb-10 max-w-4xl">
            Choosing the best Tesla accessories can greatly enhance your Tesla ownership experience and personalize your
            vehicle. Here are some reasons why you should consider your car additions.
          </p>

          <div className="space-y-8 max-w-4xl">
            {[
              {
                title: 'Quality',
                text: 'Our accessories are crafted with the highest quality standards, ensuring reliability, durability, and long-lasting performance. We meticulously select materials and manufacturing processes to guarantee that each addition meets our rigorous standards.',
              },
              {
                title: 'Perfect Fit',
                text: 'We understand the importance of seamless integration with your car. Our Tesla car accessories are designed and engineered to fit your vehicle perfectly. You can trust that when you purchase from Teslahubs, you\'re getting products that not only look great but also enhance the overall aesthetic of your car.',
              },
              {
                title: 'Easy Installation',
                text: 'We believe in making things simple for our customers. All of our accessories for Tesla are designed for easy installation, so you can spend less time fussing with complicated setups and more time enjoying your car.',
              },
              {
                title: 'Prices',
                text: 'We believe that enhancing your Tesla experience shouldn\'t break the bank. That\'s why we\'ve struck the perfect balance between offering high-quality accessories while maintaining competitive prices, ensuring that you get the best value for your money.',
              },
            ].map(({ title, text }) => (
              <div key={title} className="border-t border-[#e5e5e5] pt-6">
                <h3 className="text-lg font-bold text-[#111] mb-2">{title}</h3>
                <p className="text-[#555] text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
