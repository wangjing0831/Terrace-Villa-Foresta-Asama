'use client';

import { useState, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const adminBase = pathname.startsWith('/test') ? '/test/admin' : '/admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push(adminBase);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="gold-line" />
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Admin</span>
            <div className="gold-line" />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-[0.3em] text-white mb-2">
            Terrace Villa
          </h1>
          <p className="font-display text-gold text-xs uppercase tracking-[0.4em]">Foresta Asama</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-display text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-transparent border border-white/10 px-4 py-3 text-white font-display text-sm tracking-wider focus:outline-none focus:border-gold/60 transition-colors duration-300 placeholder:text-white/20"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block font-display text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-transparent border border-white/10 px-4 py-3 text-white font-display text-sm tracking-wider focus:outline-none focus:border-gold/60 transition-colors duration-300 placeholder:text-white/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-display text-red-400/80 text-[10px] uppercase tracking-widest text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-black font-display text-xs uppercase tracking-[0.4em] py-4 hover:bg-gold/80 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Default credentials hint */}
        <p className="text-center font-display text-white/15 text-[9px] uppercase tracking-widest mt-8">
          admin
        </p>
      </div>
    </div>
  );
}
