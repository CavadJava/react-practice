import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log('Login:', form);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-[#e4e4e7] w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-[#111111] font-bold text-2xl tracking-widest">
            TESLA<span className="text-[#cc0000]">HUBS</span>
          </Link>
          <h2 className="text-xl font-bold mt-4 mb-1">Hesabınıza Giriş Edin</h2>
          <p className="text-gray-500 text-sm">Xoş gəldiniz, davam etmək üçün giriş edin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@nümunə.com"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full border border-[#e4e4e7] rounded px-3 py-2.5 text-sm outline-none focus:border-[#cc0000] transition-colors"
            />
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-[#cc0000] hover:underline">Şifrəni unutdunuz?</a>
          </div>
          <button
            type="submit"
            className="w-full bg-[#cc0000] text-white font-semibold py-3 rounded hover:bg-[#b30000] transition-colors"
          >
            Giriş Et
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Hesabınız yoxdur?{' '}
          <Link to="/register" className="text-[#cc0000] font-medium hover:underline">
            Qeydiyyatdan keçin
          </Link>
        </p>
      </div>
    </div>
  );
}
