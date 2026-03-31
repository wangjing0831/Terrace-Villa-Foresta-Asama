'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

interface ContactInfo {
  phone: string;        phoneVisible: boolean;
  email: string;        emailVisible: boolean;
  lineId: string;       lineVisible: boolean;
  wechatId: string;     wechatVisible: boolean;
}

export default function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const base = pathname.startsWith('/test') ? '/test' : '';
  const [contact, setContact] = useState<ContactInfo | null>(null);

  useEffect(() => {
    fetch('/api/contact')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setContact(d))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-dark-tertiary border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-6">
              <div className="text-gold text-[10px] tracking-[0.6em] uppercase mb-1">Luxury Villa Resort</div>
              <h3 className="font-display text-white text-2xl font-bold tracking-widest uppercase">
                Terrace Villa
              </h3>
              <h3 className="font-display text-gold text-2xl font-bold tracking-widest uppercase">
                Foresta Asama
              </h3>
            </div>
            <div className="w-12 h-[1px] bg-gold/40 mb-4"></div>
            <p className="font-kaiti italic text-white/40 text-sm leading-relaxed">
              {t(translations.footer.address)}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-gold text-xs tracking-[0.4em] uppercase mb-6">Navigation</h4>
            <nav className="flex flex-col gap-3">
              {[
                { key: 'home', href: base || '/' },
                { key: 'library', href: base + '/library' },
                { key: 'plans', href: base + '/plans' },
                { key: 'surroundings', href: base + '/surroundings' },
              ].map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="font-display text-xs tracking-[0.3em] uppercase text-white/40 hover:text-gold transition-colors duration-300"
                >
                  {t(translations.nav[item.key as keyof typeof translations.nav])}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-gold text-xs tracking-[0.4em] uppercase mb-6">Contact</h4>
            <div className="space-y-3 text-sm text-white/40">
              {contact ? (
                <>
                  {contact.phoneVisible && contact.phone && (
                    <div className="flex items-start gap-3">
                      <span className="text-gold mt-0.5">✦</span>
                      <a href={`tel:${contact.phone}`} className="hover:text-gold transition-colors">{contact.phone}</a>
                    </div>
                  )}
                  {contact.emailVisible && contact.email && (
                    <div className="flex items-start gap-3">
                      <span className="text-gold mt-0.5">✦</span>
                      <a href={`mailto:${contact.email}`} className="hover:text-gold transition-colors break-all">{contact.email}</a>
                    </div>
                  )}
                  {contact.lineVisible && contact.lineId && (
                    <div className="flex items-start gap-3">
                      <span className="text-gold mt-0.5">✦</span>
                      <span>LINE: {contact.lineId}</span>
                    </div>
                  )}
                  {contact.wechatVisible && contact.wechatId && (
                    <div className="flex items-start gap-3">
                      <span className="text-gold mt-0.5">✦</span>
                      <span>WeChat: {contact.wechatId}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-gold mt-0.5">✦</span>
                  <span className="font-kaiti italic">Karuizawa, Nagano, Japan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gold Divider */}
        <div className="gold-divider mb-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-[10px] uppercase tracking-widest">
            © 2025 Terrace Villa Foresta Asama. {t(translations.footer.rights)}.
          </p>
          <Link
            href={base + '/admin'}
            className="text-white/20 text-[10px] uppercase tracking-widest hover:text-gold/50 transition-colors duration-300"
          >
            {t(translations.nav.admin)}
          </Link>
        </div>
      </div>
    </footer>
  );
}
