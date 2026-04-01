'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

interface PlanEntry {
  id: string;
  titleZh: string; titleJa: string; titleEn: string;
  descZh: string;  descJa: string;  descEn: string;
  duration: number;
  price: string;
  tagZh: string; tagJa: string; tagEn: string;
  highlightsZh: string[]; highlightsJa: string[]; highlightsEn: string[];
  coverImage: string;
  visible: boolean;
  budgetTotalZh: string | null;
  budgetTotalJa: string | null;
  budgetTotalEn: string | null;
}

export default function PlansPage() {
  const { t, language } = useLanguage();
  const lang = language as 'zh' | 'ja' | 'en';
  const apiBase = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/api';
  const [plans, setPlans]       = useState<PlanEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(apiBase + '/plans?public=1')
      .then((r) => r.ok ? r.json() : [])
      .then((data: PlanEntry[]) => setPlans(data))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const getTitle = (p: PlanEntry) => lang === 'zh' ? p.titleZh : lang === 'ja' ? p.titleJa : p.titleEn;
  const getDesc  = (p: PlanEntry) => lang === 'zh' ? p.descZh  : lang === 'ja' ? p.descJa  : p.descEn;
  const getTag   = (p: PlanEntry) => lang === 'zh' ? p.tagZh   : lang === 'ja' ? p.tagJa   : p.tagEn;
  const getHighlights = (p: PlanEntry) => lang === 'zh' ? p.highlightsZh : lang === 'ja' ? p.highlightsJa : p.highlightsEn;
  const getTotal = (p: PlanEntry) =>
    (lang === 'zh' ? p.budgetTotalZh : lang === 'ja' ? p.budgetTotalJa : p.budgetTotalEn) ?? p.price;

  // Fallback cover image path (static files if no uploaded cover)
  const coverSrc = (p: PlanEntry) => p.coverImage || `/images/plans/${p.id}.jpg`;

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="gold-line" />
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Curated Experiences</span>
            <div className="gold-line" />
          </div>
          <h1 className="section-title mb-4">{t(translations.plans.title)}</h1>
          <div className="gold-divider w-48 mx-auto mb-6" />
          <p className="section-subtitle max-w-2xl mx-auto">{t(translations.plans.subtitle)}</p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-24 text-gold/40 font-display text-xs uppercase tracking-widest animate-pulse">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-24 text-white/20 font-kaiti italic">No plans available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const tag = getTag(plan);
                return (
                  <Link key={plan.id} href={`/plans/${plan.id}`} className="luxury-card group block overflow-hidden">
                    {/* Cover image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                      {!imgErrors[plan.id] ? (
                        <Image
                          src={coverSrc(plan)}
                          alt={getTitle(plan)}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={() => setImgErrors((prev) => ({ ...prev, [plan.id]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                          <span className="font-display text-white/10 text-xs uppercase tracking-widest">{plan.id}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent" />
                      {tag && (
                        <div className="absolute top-4 left-4 bg-gold text-black text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1">
                          {tag}
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4">
                        <span className="font-display text-gold text-xs tracking-[0.4em] uppercase">
                          {plan.duration} {t(translations.plans.days)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h2 className="font-serif text-white text-xl font-bold mb-3 group-hover:text-gold transition-colors duration-300">
                        {getTitle(plan)}
                      </h2>
                      <p className="font-kaiti italic text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">
                        {getDesc(plan)}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-1.5 mb-6">
                        {getHighlights(plan).filter(Boolean).map((h, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px] text-white/40">
                            <span className="w-1 h-1 bg-gold rounded-full flex-shrink-0" />
                            <span className="font-kaiti">{h}</span>
                          </div>
                        ))}
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                          <div className="text-white/30 text-[10px] uppercase tracking-widest font-display mb-0.5">
                            {t(translations.plans.price_from)}
                          </div>
                          <div className="text-gold font-display font-bold text-lg">{getTotal(plan)}</div>
                          <div className="text-white/30 text-[10px] uppercase tracking-widest font-display">
                            {t(translations.plans.per_person)}
                          </div>
                        </div>
                        <div className="text-white/30 text-xs font-display uppercase tracking-widest group-hover:text-gold transition-colors duration-300">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
