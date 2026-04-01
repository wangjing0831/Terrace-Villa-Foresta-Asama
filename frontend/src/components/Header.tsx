'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/translations';
import ContactModal from '@/components/ContactModal';

const baseNavItems = [
  { key: 'home',         href: '/',             label: 'Home' },
  { key: 'library',      href: '/library',       label: 'Gallery' },
  { key: 'plans',        href: '/plans',         label: 'Plans' },
  { key: 'surroundings', href: '/surroundings',  label: 'Surroundings' },
];

const languages: { code: Language; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
];

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const navItems = baseNavItems.map((item) => ({
    ...item,
    href: item.href === '/' ? (base || '/') : base + item.href,
  }));
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-dark/95 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={base || '/'} className="flex flex-col">
          <span className="font-display text-gold text-xs tracking-[0.5em] uppercase">
            Terrace Villa
          </span>
          <span className="font-display text-white font-bold text-lg tracking-widest uppercase leading-tight">
            Foresta Asama
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`font-display text-xs tracking-[0.3em] uppercase transition-colors duration-300 ${
                  isActive
                    ? 'text-gold border-b border-gold pb-0.5'
                    : 'text-white/60 hover:text-gold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher + Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 border border-white/10 rounded-sm overflow-hidden">
            {languages.map((lang, idx) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2.5 py-1 text-[10px] font-display uppercase tracking-widest transition-all duration-200 ${
                  language === lang.code
                    ? 'bg-gold text-black font-bold'
                    : 'text-white/40 hover:text-white/80'
                } ${idx > 0 ? 'border-l border-white/10' : ''}`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Contact Button */}
          <button
            onClick={() => setContactOpen(true)}
            className="hidden md:block font-display text-xs tracking-[0.3em] uppercase text-white/60 hover:text-gold transition-colors duration-300"
          >
            Contact
          </button>

          {/* Admin Link */}
          <Link href={base + '/admin/login'}
            className="hidden md:block font-display text-[9px] tracking-[0.3em] uppercase text-white/15 hover:text-white/40 transition-colors duration-300">
            Admin
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white/60 hover:text-gold transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark/98 backdrop-blur-md border-t border-white/5">
          <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`font-display text-sm tracking-[0.3em] uppercase py-2 border-b border-white/5 ${
                    isActive ? 'text-gold' : 'text-white/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setMenuOpen(false); setContactOpen(true); }}
              className="font-display text-sm tracking-[0.3em] uppercase py-2 border-b border-white/5 text-white/60 text-left"
            >
              Contact
            </button>
          </nav>
        </div>
      )}

      {/* Contact Modal */}
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </header>
  );
}
