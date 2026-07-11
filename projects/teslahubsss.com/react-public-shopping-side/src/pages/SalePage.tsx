import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  img: string;
  price: string;
  originalPrice?: string;
  save?: string;
  from?: boolean;
}

const sections: { title: string; link: string; items: Product[] }[] = [
  {
    title: 'Best Sellers',
    link: '/shop',
    items: [
      { id: 1, name: 'TeslaHubs™ ProGuard Noise Reduction Kit', img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80', price: '$79.99', originalPrice: '$179.99', save: '$100' },
      { id: 2, name: 'Teslahubs™ Space Box CarPlay', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', price: '$139.99', originalPrice: '$299.00', save: '$159' },
      { id: 3, name: 'Teslahubs™ Aluminium Caliper Covers', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', price: '$149.99', originalPrice: '$300.00', save: '$150', from: true },
      { id: 4, name: 'Solar Shield® Roof Sunshade Pro Kit', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80', price: '$139.99', originalPrice: '$185.00', save: '$45' },
      { id: 5, name: 'DashGlow 360° Vision System (BLIS)', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80', price: '$149.99', originalPrice: '$199.99', save: '$50' },
      { id: 6, name: 'Teslahubs™ Rear Display Screen ULTRA', img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80', price: '$249.99', originalPrice: '$399.99', save: '$150' },
    ],
  },
  {
    title: 'Noise Protection',
    link: '/shop?cat=noise',
    items: [
      { id: 10, name: 'ProGuard Advanced Noise Reduction Blue Edition', img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80', price: '$94.99', originalPrice: '$164.99', save: '$70', from: true },
      { id: 11, name: 'ProGuard Standard', img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80', price: '$79.99', originalPrice: '$179.99', save: '$100', from: true },
      { id: 12, name: 'ProGuard PLUS Version', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80', price: '$79.99', originalPrice: '$200.00', save: '$120', from: true },
    ],
  },
  {
    title: 'Tech Upgrades',
    link: '/shop?cat=tech',
    items: [
      { id: 20, name: 'Dash Screen PRO, CarPlay Ultra', img: 'https://images.unsplash.com/photo-1620060236457-29bb61baa781?w=400&q=80', price: '$239.99', originalPrice: '$389.99', save: '$150', from: true },
      { id: 21, name: 'Teslahubs™ Space Box - CarPlay', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', price: '$139.99', originalPrice: '$299.00', save: '$159' },
      { id: 22, name: 'Teslahubs™ Rear Display Screen ULTRA', img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80', price: '$249.99', originalPrice: '$399.99', save: '$150' },
      { id: 23, name: 'Ring Key', img: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&q=80', price: '$129.99', originalPrice: '$159.99', save: '$30' },
    ],
  },
  {
    title: 'Lights',
    link: '/shop?cat=lights',
    items: [
      { id: 30, name: 'Midnight Glow, Tesla Projector Doors Lights', img: 'https://images.unsplash.com/photo-1592805144716-feeccccef5ac?w=400&q=80', price: '$29.99', originalPrice: '$39.99', save: '$10', from: true },
      { id: 31, name: 'Teslahubs™ RGB Dash Light', img: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80', price: '$39.99', originalPrice: '$59.99', save: '$20' },
      { id: 32, name: 'DashGlow 360° Vision System (BLIS)', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80', price: '$149.99', originalPrice: '$199.99', save: '$50' },
    ],
  },
  {
    title: 'Wheels',
    link: '/shop?cat=wheels',
    items: [
      { id: 40, name: 'Teslahubs™ Aluminium Caliper Covers', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', price: '$149.99', originalPrice: '$300.00', save: '$150', from: true },
      { id: 41, name: 'Teslahubs™ Rim Shield Advanced Protection Kit', img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80', price: '$48.99', from: true },
      { id: 42, name: 'Teslahubs™ Aluminium Rim Protectors', img: 'https://images.unsplash.com/photo-1596742578443-7682ef5251cd?w=400&q=80', price: '$249.99', originalPrice: '$299.99', save: '$50' },
    ],
  },
  {
    title: 'Comfort',
    link: '/shop?cat=comfort',
    items: [
      { id: 50, name: 'Teslahubs™ MagSafe Phone Holder', img: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&q=80', price: '$49.99', originalPrice: '$59.99', save: '$10', from: true },
      { id: 51, name: 'Teslahubs™ Silicon Dashboard Phone Holder', img: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&q=80', price: '$34.99' },
      { id: 52, name: 'Teslahubs™ WindShield Wipers', img: 'https://images.unsplash.com/photo-1609360953681-41b53820e69b?w=400&q=80', price: '$87.99', originalPrice: '$114.99', save: '$27' },
      { id: 53, name: 'Teslahubs™ OmniVolt 2-in-1 CCS & J1772 Adapter', img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80', price: '$139.00', originalPrice: '$199.00', save: '$60' },
    ],
  },
];

function ProductCard({ p }: { p: Product }) {
  return (
    <Link to={`/product/${p.id}`} className="group">
      <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#1a1a1a] mb-3">
        {p.save && (
          <span className="absolute top-2 left-2 z-10 bg-[#22c55e] text-white text-[10px] font-black px-2 py-0.5 rounded">
            UP TO {p.save} OFF
          </span>
        )}
        <img
          src={p.img}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      <p className="text-sm text-[#111] font-medium leading-snug mb-2 line-clamp-2">{p.name}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[#cc0000] font-bold text-sm">
          {p.from ? 'From ' : ''}{p.price}
        </span>
        {p.originalPrice && (
          <span className="text-[#999] text-xs line-through">{p.originalPrice}</span>
        )}
      </div>
      {p.save && (
        <span className="inline-block mt-1 bg-[#cc0000] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
          SAVE {p.save}
        </span>
      )}
    </Link>
  );
}

export default function SalePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Sale hero banner */}
      <div className="bg-[#111] text-white text-center py-10 px-4">
        <p className="text-sm font-semibold text-[#cc0000] uppercase tracking-widest mb-2">Limited Time</p>
        <h1 className="text-4xl sm:text-5xl font-black mb-2">Tesla Birthday Sale</h1>
        <p className="text-6xl sm:text-7xl font-black text-white">UP TO 65% OFF</p>
      </div>

      {/* Sections */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-16">
        {sections.map((sec) => (
          <section key={sec.title}>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-[#111]">{sec.title}</h2>
              <Link to={sec.link} className="text-sm text-[#2563eb] font-semibold hover:underline">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {sec.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
