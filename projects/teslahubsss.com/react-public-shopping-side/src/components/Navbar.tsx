import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

/* ── Mega menu data ── */
const modelYCategories = [
  {
    label: 'Best Sellers', to: '/model-y?cat=best-sellers',
    img: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=600&q=80',
    badge: 'UP TO 70%OFF',
  },
  {
    label: 'Noise Protection', to: '/model-y?cat=noise',
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
  },
  {
    label: 'Tech Upgrades', to: '/model-y?cat=tech',
    img: 'https://images.unsplash.com/photo-1620060236457-29bb61baa781?w=600&q=80',
  },
  {
    label: 'Wheels Protection', to: '/model-y?cat=wheels',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    label: 'Lights', to: '/model-y?cat=lights',
    img: 'https://images.unsplash.com/photo-1592805144716-feeccccef5ac?w=600&q=80',
  },
];

const model3Collections = ['Noise Protection', 'Wheels', 'Tech Upgrades', 'Interior', 'Exterior'];

const model3Products = [
  {
    name: 'TeslaHubs™ ProGuard: Advanced Noise Reduction & Weatherproofing Kit',
    price: 'From $139.00', save: 'SAVE $174',
    img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=300&q=80',
  },
  {
    name: 'TeslaHubs™ ProGuard: Advanced Noise Reduction & Weatherproofing Kit PLUS Version',
    price: 'From $139.00', save: 'SAVE $208',
    img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=300&q=80',
  },
  {
    name: 'TeslaHubs™ ProGuard: Advanced Noise Reduction & Weatherproofing Kit Blue Edition',
    price: 'From $165.00', save: 'SAVE $122',
    img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=300&q=80',
  },
  {
    name: 'Teslahubs™ Sunroof Seal Model 3/Y',
    price: 'From $29.99',
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80',
    light: true,
  },
];

const allModels = [
  { label: 'Model X', to: '/model-x', img: 'https://images.unsplash.com/photo-1622489831836-b04d3b29d5ed?w=800&q=80' },
  { label: 'Model S', to: '/model-s', img: 'https://images.unsplash.com/photo-1536700503949-6e2a88a4e20c?w=800&q=80' },
  { label: 'Cybertruck', to: '/cybertruck', img: 'https://images.unsplash.com/photo-1680083810038-47d5e571bc1c?w=800&q=80' },
];

/* ── Mega-menu components ── */

function ModelYDropdown() {
  return (
    <div className="absolute top-full left-0 right-0 flex bg-[#0a0a0a] border-t border-[#cc0000]/20 shadow-2xl z-40">
      {modelYCategories.map((cat) => (
        <Link
          key={cat.label}
          to={cat.to}
          className="flex-1 relative group overflow-hidden"
          style={{ height: 320 }}
        >
          <img
            src={cat.img}
            alt={cat.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          {cat.badge && (
            <span className="absolute top-3 left-3 bg-[#22c55e] text-white text-xs font-black px-2.5 py-1 rounded">
              {cat.badge}
            </span>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <span className="font-bold text-base">{cat.label}</span>
            <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Model3Dropdown() {
  const [activeCol, setActiveCol] = useState('Noise Protection');
  return (
    <div
      className="absolute top-full left-0 right-0 flex bg-[#0a0a0a] border-t border-[#cc0000]/20 shadow-2xl z-40"
      style={{ minHeight: 340 }}
    >
      {/* Left sidebar */}
      <div className="w-52 border-r border-[#1e1e1e] p-6 flex flex-col shrink-0">
        <p className="text-[#555] text-[10px] uppercase tracking-widest mb-5">Collections</p>
        {model3Collections.map((c) => (
          <button
            key={c}
            onMouseEnter={() => setActiveCol(c)}
            className={`text-left text-lg font-semibold mb-3 transition-colors ${
              activeCol === c ? 'text-white' : 'text-[#555] hover:text-[#999]'
            }`}
          >
            {c}
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-[#1e1e1e]">
          <Link
            to="/model-3"
            className="text-sm text-white flex items-center gap-1 hover:text-[#c8c8c8] transition-colors"
          >
            View all products <span>→</span>
          </Link>
        </div>
      </div>

      {/* Right: products */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[#555] text-[10px] uppercase tracking-widest">MOST POPULAR</span>
          <Link to="/model-3?cat=noise" className="text-sm text-white hover:text-[#c8c8c8] transition-colors">
            All {activeCol} (6) →
          </Link>
        </div>
        <div className="flex gap-4">
          {model3Products.map((p) => (
            <Link
              key={p.name}
              to="/model-3"
              className="w-52 group"
            >
              <div
                className={`rounded-xl overflow-hidden mb-3 aspect-square ${
                  p.light ? 'bg-white' : 'bg-[#1a1a1a]'
                }`}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs text-white mb-1.5 line-clamp-2 leading-snug">{p.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#cc0000] text-sm font-bold">{p.price}</span>
                {p.save && (
                  <span className="bg-[#cc0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {p.save}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllModelsDropdown() {
  return (
    <div className="absolute top-full left-0 right-0 flex bg-[#0a0a0a] border-t border-[#cc0000]/20 shadow-2xl z-40">
      {allModels.map((m) => (
        <Link
          key={m.label}
          to={m.to}
          className="flex-1 relative group overflow-hidden"
          style={{ height: 280 }}
        >
          <img
            src={m.img}
            alt={m.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-5 flex items-center gap-2 text-white">
            <span className="font-bold text-xl">{m.label}</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ── Nav link with pill ── */
function NavItem({
  to,
  label,
  isMenuOpen,
  onEnter,
}: {
  to: string;
  label: string;
  isMenuOpen?: boolean;
  onEnter: () => void;
}) {
  return (
    <NavLink
      to={to}
      onMouseEnter={onEnter}
      className={({ isActive }) => {
        const pill = isActive || isMenuOpen;
        return `px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
          pill ? 'bg-white text-black' : 'text-[#c8c8c8] hover:text-white'
        }`;
      }}
    >
      {label}
    </NavLink>
  );
}

/* ── Main Navbar ── */
export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<'model-y' | 'model-3' | 'all-models' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setActiveMenu(null);

  return (
    <header
      className="sticky top-0 z-50 bg-[#111111] border-b border-[#cc0000]/25"
      onMouseLeave={close}
    >
      <div className="relative">
        {/* ── Nav bar ── */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center h-14 relative">
          {/* Logo — left */}
          <Link to="/" className="text-white font-black text-lg tracking-widest shrink-0 uppercase z-10">
            Teslahubs
          </Link>

          {/* Desktop links — absolutely centered */}
          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <NavLink
              to="/sale"
              onMouseEnter={close}
              className={({ isActive }) =>
                `px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                  isActive ? 'bg-white text-black' : 'text-[#c8c8c8] hover:text-white'
                }`
              }
            >
              SALE
            </NavLink>

            <NavItem to="/model-y"    label="Model Y"    isMenuOpen={activeMenu === 'model-y'}    onEnter={() => setActiveMenu('model-y')} />
            <NavItem to="/model-3"    label="Model 3"    isMenuOpen={activeMenu === 'model-3'}    onEnter={() => setActiveMenu('model-3')} />
            <NavItem to="/all-models" label="All Models" isMenuOpen={activeMenu === 'all-models'} onEnter={() => setActiveMenu('all-models')} />

            {(['Shop All', 'Order Status', 'Support', 'Digest'] as const).map((label) => {
              const to = `/${label.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <NavLink
                  key={label}
                  to={to}
                  onMouseEnter={close}
                  className={({ isActive }) =>
                    `px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                      isActive ? 'bg-white text-black' : 'text-[#c8c8c8] hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right icons — ml-auto pushes to right */}
          <div className="flex items-center gap-3 ml-auto z-10">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </button>
            <Link to="/login" className="text-white/70 hover:text-white transition-colors p-1" aria-label="Account">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </Link>
            <Link to="/cart" className="relative text-white/70 hover:text-white transition-colors p-1" aria-label="Cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </Link>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-white/70 hover:text-white p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-3">
            <form onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.querySelector('input') as HTMLInputElement).value; if (q) navigate(`/shop?q=${q}`); }}>
              <input
                autoFocus
                type="search"
                placeholder="Search products..."
                className="w-full bg-[#1e1e1e] text-white border border-[#333] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#cc0000] placeholder-gray-500"
              />
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#222] bg-[#111] pb-4">
            {['/', '/sale', '/model-y', '/model-3', '/all-models', '/shop', '/order-status', '/support', '/digest'].map((path) => {
              const label = path === '/' ? 'Home' : path.slice(1).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm text-[#c8c8c8] hover:text-white border-b border-[#1e1e1e]"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Mega menus ── */}
        {activeMenu === 'model-y' && <ModelYDropdown />}
        {activeMenu === 'model-3' && <Model3Dropdown />}
        {activeMenu === 'all-models' && <AllModelsDropdown />}
      </div>
    </header>
  );
}
