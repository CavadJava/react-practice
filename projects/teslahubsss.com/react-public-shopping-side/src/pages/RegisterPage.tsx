import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log('Register:', form);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-[#e4e4e7] w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-[#111111] font-bold text-2xl tracking-widest">
            TESLA<span className="text-[#cc0000]">HUBS</span>
          </Link>
          <h2 className="text-xl font-bold mt-4 mb-1">Yeni Hesab Yaradın</h2>
          <p className="text-gray-500 text-sm">Qeydiyyatdan keçərək sifariş verin və statusu izləyin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="Əli Hüseynov"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="email@nümunə.com"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+994 50 123 45 67"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifrəni Təsdiqlə</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              placeholder="••••••••"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#cc0000] text-white font-semibold py-3 rounded hover:bg-[#b30000] transition-colors"
          >
            Qeydiyyatdan Keç
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Artıq hesabınız var?{' '}
          <Link to="/login" className="text-[#cc0000] font-medium hover:underline">
            Giriş edin
          </Link>
        </p>
      </div>
    </div>
  );
}
