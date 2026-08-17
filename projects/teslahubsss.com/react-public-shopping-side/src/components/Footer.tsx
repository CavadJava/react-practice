import { useState } from 'react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { to: '/digest', label: 'Digest' },
  { to: '/order-status', label: 'Track Order' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contacts' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund', label: 'Refund Policy' },
  { to: '/shipping', label: 'Payment & Shipping Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
];

const paymentIcons = [
  'Amex', 'Apple Pay', 'Bancontact', 'Diners', 'Discover',
  'Google Pay', 'Maestro', 'Mastercard', 'PayPal', 'Shop Pay', 'Visa',
];

const policies = [
  'Refund policy', 'Privacy policy', 'Terms of service',
  'Shipping policy', 'Contact information', 'Legal notice', 'Cancellation policy',
];

const socials = [
  {
    label: 'Facebook',
    path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  },
  {
    label: 'Instagram',
    path: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a2 2 0 002-2v-11a2 2 0 00-2-2h-11a2 2 0 00-2 2v11a2 2 0 002 2z',
  },
  {
    label: 'TikTok',
    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 104.29 6.01V8.69a8.2 8.2 0 004.78 1.52V6.73a4.85 4.85 0 01-1.02-.04z',
  },
  {
    label: 'Pinterest',
    path: 'M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.135-1.867 3.135-4.56 0-2.384-1.715-4.052-4.163-4.052-2.837 0-4.5 2.128-4.5 4.328 0 .857.33 1.775.741 2.277a.3.3 0 01.069.284l-.276 1.126c-.044.18-.146.218-.337.131-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z',
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* Main footer grid */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 pb-12 border-b border-[#333]">

          {/* Quick links */}
          <div>
            <h5 className="text-base font-semibold mb-5 text-white">Quick links</h5>
            <ul className="space-y-2.5">
              {quickLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="text-[#c8c8c8] text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-3">
              <p className="text-sm text-[#c8c8c8]">Our support service is available 24/7 ❤️</p>
              <a
                href="mailto:hello@teslahubs.com"
                className="block text-white font-semibold underline underline-offset-4 text-sm hover:text-[#c8c8c8] transition-colors"
              >
                hello@teslahubs.com
              </a>
              <a
                href="#"
                className="block text-white underline underline-offset-4 text-sm leading-relaxed hover:text-[#c8c8c8] transition-colors"
              >
                United Kingdom, London 71-75 Shelton Street, Covent Garden, WC2H 9JQ
              </a>
              <a
                href="#"
                className="block text-white underline underline-offset-4 text-sm leading-relaxed hover:text-[#c8c8c8] transition-colors"
              >
                USA, FL, Hollywood, 3500 W Hallandale Beach Blvd, 33023
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-3xl sm:text-4xl font-black leading-tight mb-8">
              Stay in the loop<br />with our weekly<br />newsletter
            </h3>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
              className="flex items-center gap-0"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-[#2a2a2a] border border-[#444] rounded-l-full px-5 py-3 text-sm text-white outline-none focus:border-white placeholder-[#666]"
              />
              <button
                type="submit"
                className="bg-white text-black rounded-r-full px-4 py-3 hover:bg-gray-200 transition-colors"
                aria-label="Subscribe"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex justify-center gap-8 py-8 border-b border-[#333]">
          {socials.map(({ label, path }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="text-white hover:text-[#c8c8c8] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={path} />
              </svg>
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#c8c8c8]">© 2026 Hub.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {policies.map((p) => (
                <a key={p} href="#" className="text-xs text-[#c8c8c8] hover:text-white transition-colors">
                  {p}
                </a>
              ))}
            </div>
          </div>

          {/* Language / Region / Payments */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <button className="flex items-center gap-1.5 border border-[#444] rounded-full px-3 py-1.5 text-xs text-[#c8c8c8] hover:border-[#666] transition-colors">
                🌐 English ▾
              </button>
              <button className="flex items-center gap-1.5 border border-[#444] rounded-full px-3 py-1.5 text-xs text-[#c8c8c8] hover:border-[#666] transition-colors">
                🇺🇸 United States (USD $) ▾
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {paymentIcons.map((icon) => (
                <span
                  key={icon}
                  className="inline-flex items-center bg-white rounded px-2 py-0.5 text-[#111] text-[10px] font-bold h-6"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="pt-3 border-t border-[#333]">
            <p className="text-xs font-semibold text-[#c8c8c8] mb-2">Disclaimer</p>
            <p className="text-[11px] text-[#666] leading-relaxed max-w-4xl">
              The Tesla names, marks and designs, Model S, Model X, Model 3, Model Y, Tesla Semi and the "TESLA," "T" and
              "TESLA and T in Crest" designs are trademark and/or registered trademark of Tesla Motors, Inc. in the United
              States and other countries. TeslaHubs, this site and its content are not affiliated with or endorsed by Tesla
              Motors. All products offered on this website are aftermarket products and not made by Tesla Motors, Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
