'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

type Lang = 'zh' | 'ja' | 'en';

interface PlanHighlight {
  id: number;
  sortOrder: number;
  titleZh: string; titleJa: string; titleEn: string;
  descriptionZh: string; descriptionJa: string; descriptionEn: string;
  imageUrl: string;
}

interface PlanDay {
  id: number;
  dayNumber: number;
  titleZh: string; titleJa: string; titleEn: string;
  activitiesZh: string[]; activitiesJa: string[]; activitiesEn: string[];
  mealMorningZh: string; mealMorningJa: string; mealMorningEn: string;
  mealLunchZh: string;   mealLunchJa: string;   mealLunchEn: string;
  mealDinnerZh: string;  mealDinnerJa: string;  mealDinnerEn: string;
}

interface PlanBudgetItem {
  id: number;
  sortOrder: number;
  categoryZh: string; categoryJa: string; categoryEn: string;
  amount: string;
  noteZh: string; noteJa: string; noteEn: string;
}

interface FullPlan {
  id: string;
  titleZh: string; titleJa: string; titleEn: string;
  prestigeZh: string; prestigeJa: string; prestigeEn: string;
  coverImage: string;
  accommodationImages: string[];
  conclusionZh: string; conclusionJa: string; conclusionEn: string;
  duration: number;
  price: string;
  visible: boolean;
  highlights: PlanHighlight[];
  days: PlanDay[];
  budgetItems: PlanBudgetItem[];
}

const ACCOMMODATION_TITLE: Record<Lang, string> = {
  zh: '奢华下榻 · Terrace Villa Foresta Asama',
  ja: 'ご宿泊 · Terrace Villa Foresta Asama',
  en: 'Accommodation · Terrace Villa Foresta Asama',
};

const ACCOMMODATION_DESC: Record<Lang, string> = {
  zh: '浅间山麓，轻井泽森林深处，独栋别墅静候您的到来。每一处细节皆为您精心打造，让您在大自然的怀抱中感受极致奢华。',
  ja: '浅間山麓、軽井沢の森の奥深くに佇む独立ヴィラが皆様をお迎えします。すべての細部にこだわり、大自然の中で究極の贅沢をお楽しみください。',
  en: 'Nestled in the forests of Karuizawa at the foot of Mt. Asama, our private villas await your arrival. Every detail has been crafted for you, offering ultimate luxury in the embrace of nature.',
};

const HIGHLIGHTS_TITLE: Record<Lang, string> = {
  zh: '行程亮点',
  ja: '旅のハイライト',
  en: 'Highlights',
};

const CONCLUSION_TITLE: Record<Lang, string> = {
  zh: '结语',
  ja: '旅の結び',
  en: 'Conclusion',
};

function calcBudgetTotal(items: PlanBudgetItem[]): string | null {
  let total = 0;
  let hasAny = false;
  for (const item of items) {
    if (item.amount.startsWith('¥')) {
      const num = parseInt(item.amount.replace(/[¥,]/g, ''), 10);
      if (!isNaN(num)) { total += num; hasAny = true; }
    }
  }
  if (!hasAny) return null;
  return `¥${total.toLocaleString()}`;
}

export default function PlanDetailPage() {
  const params = useParams();
  const { t, language } = useLanguage();
  const lang = language as Lang;

  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const planId = params.id as string;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [planRes, layoutRes] = await Promise.all([
          fetch(`/api/plans/${planId}`),
          fetch('/api/layouts'),
        ]);
        if (!planRes.ok) { setNotFound(true); setLoading(false); return; }
        const planData: FullPlan = await planRes.json();
        setPlan(planData);
        const layout: Record<string, string[]> = layoutRes.ok ? await layoutRes.json() : {};
        setGalleryPhotos(layout[`plan.${planId}.gallery`] ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark pt-20 flex items-center justify-center">
        <div className="text-gold/40 font-display text-xs uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="min-h-screen bg-dark pt-20 flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="font-display text-gold text-2xl uppercase tracking-widest">Plan Not Found</h1>
        <p className="text-white/40 font-kaiti italic text-center">
          {lang === 'zh' ? '未找到该行程方案' : lang === 'ja' ? 'プランが見つかりません' : 'The requested plan could not be found.'}
        </p>
        <Link href="/plans" className="luxury-btn-outline">← Back to Plans</Link>
      </div>
    );
  }

  const title     = lang === 'zh' ? plan.titleZh     : lang === 'ja' ? plan.titleJa     : plan.titleEn;
  const prestige  = lang === 'zh' ? plan.prestigeZh  : lang === 'ja' ? plan.prestigeJa  : plan.prestigeEn;
  const conclusion = lang === 'zh' ? plan.conclusionZh : lang === 'ja' ? plan.conclusionJa : plan.conclusionEn;
  const budgetTotal = calcBudgetTotal(plan.budgetItems);
  const visibleHighlights = plan.highlights.filter((h) =>
    (lang === 'zh' ? h.titleZh : lang === 'ja' ? h.titleJa : h.titleEn).trim() !== ''
  );

  return (
    <div className="min-h-screen bg-dark pt-20">

      {/* ── Section 1: Hero ── */}
      <section className="relative h-[75vh] w-full overflow-hidden">
        {plan.coverImage && !imageError ? (
          <Image
            src={plan.coverImage}
            alt={title}
            fill
            unoptimized
            className="object-cover brightness-40 animate-kenburns"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark to-[#111]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-dark" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="gold-line"></div>
            <span className="text-gold text-[10px] tracking-[0.6em] font-display uppercase">
              {plan.duration} {t(translations.plans.days)}
            </span>
            <div className="gold-line"></div>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 uppercase">
            {title}
          </h1>
          <div className="gold-divider w-48 mb-6" />
          {prestige && (
            <p className="font-kaiti italic text-gold-light text-lg max-w-2xl">
              {prestige}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">

        {/* ── Section 2: Accommodation ── */}
        <section className="py-16 border-b border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="gold-line"></div>
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">
              {ACCOMMODATION_TITLE[lang]}
            </span>
          </div>
          <p className="font-kaiti italic text-white/70 text-lg leading-relaxed mb-8 max-w-3xl">
            {ACCOMMODATION_DESC[lang]}
          </p>
          {plan.accommodationImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {plan.accommodationImages.slice(0, 3).map((url, idx) => (
                <div key={idx} className="relative aspect-[4/3] overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-500">
                  <Image
                    src={url}
                    alt={`accommodation-${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Highlights ── */}
        {visibleHighlights.length > 0 && (
          <section className="py-12 border-b border-white/5">
            <div className="flex items-center gap-8 mb-10">
              <h2 className="section-title">{HIGHLIGHTS_TITLE[lang]}</h2>
              <div className="h-[1px] flex-1 bg-gold/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleHighlights.map((h) => {
                const htitle = lang === 'zh' ? h.titleZh : lang === 'ja' ? h.titleJa : h.titleEn;
                const hdesc  = lang === 'zh' ? h.descriptionZh : lang === 'ja' ? h.descriptionJa : h.descriptionEn;
                return (
                  <div key={h.id} className="luxury-card overflow-hidden flex flex-col sm:flex-row gap-0">
                    {h.imageUrl && (
                      <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0">
                        <Image
                          src={h.imageUrl}
                          alt={htitle}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1">
                      <h3 className="font-serif font-bold text-white text-base mb-2">{htitle}</h3>
                      {hdesc && (
                        <p className="font-kaiti italic text-white/60 text-sm leading-relaxed">{hdesc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Gallery photos (from layouts) ── */}
        {galleryPhotos.length > 0 && (
          <section className="py-8 border-b border-white/5">
            <div className="flex items-center gap-8 mb-8">
              <h2 className="section-title">Gallery</h2>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {galleryPhotos.map((url, idx) => (
                <div
                  key={idx}
                  className="break-inside-avoid mb-3 relative group cursor-pointer overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-500"
                  onClick={() => { setLightboxIdx(idx); setLightboxOpen(true); }}
                >
                  <Image
                    src={url}
                    alt={`gallery-${idx + 1}`}
                    width={600}
                    height={400}
                    unoptimized
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 border border-gold/40 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lightboxOpen && (
              <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
                <div className="relative w-full max-w-5xl mx-auto px-8 sm:px-16" onClick={(e) => e.stopPropagation()}>
                  <Image
                    src={galleryPhotos[lightboxIdx]}
                    alt={`gallery-${lightboxIdx + 1}`}
                    width={1200}
                    height={800}
                    unoptimized
                    className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                  />
                  <button onClick={() => setLightboxIdx((p) => (p - 1 + galleryPhotos.length) % galleryPhotos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all text-white/60 text-xl">‹</button>
                  <button onClick={() => setLightboxIdx((p) => (p + 1) % galleryPhotos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all text-white/60 text-xl">›</button>
                  <button onClick={() => setLightboxOpen(false)}
                    className="absolute -top-8 right-8 sm:right-16 text-white/40 hover:text-gold text-3xl">×</button>
                  <div className="flex justify-end mt-3">
                    <span className="font-display text-white/30 text-[10px] tracking-widest">{lightboxIdx + 1} / {galleryPhotos.length}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Section 4: Journey Details ── */}
        {plan.days.length > 0 && (
          <section className="py-8 border-b border-white/5">
            <div className="flex items-center gap-8 mb-10">
              <h2 className="section-title">{t(translations.plans.itinerary)}</h2>
              <div className="h-[1px] flex-1 bg-gold/20" />
            </div>
            <div className="space-y-6">
              {plan.days.map((day) => {
                const dayTitle      = lang === 'zh' ? day.titleZh      : lang === 'ja' ? day.titleJa      : day.titleEn;
                const activities    = lang === 'zh' ? day.activitiesZh : lang === 'ja' ? day.activitiesJa : day.activitiesEn;
                const mealMorning   = lang === 'zh' ? day.mealMorningZh : lang === 'ja' ? day.mealMorningJa : day.mealMorningEn;
                const mealLunch     = lang === 'zh' ? day.mealLunchZh   : lang === 'ja' ? day.mealLunchJa   : day.mealLunchEn;
                const mealDinner    = lang === 'zh' ? day.mealDinnerZh  : lang === 'ja' ? day.mealDinnerJa  : day.mealDinnerEn;
                return (
                  <div key={day.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-b border-white/5 pb-6 last:border-0">
                    <div className="hidden sm:block w-12 flex-shrink-0 font-display text-3xl font-bold text-gold/20 text-right">
                      {String(day.dayNumber).padStart(2, '0')}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-serif font-bold text-white text-lg mb-3">{dayTitle}</h3>
                        <div className="bg-white/5 p-4 rounded-sm">
                          <ul className="space-y-2">
                            {activities.map((act, aIdx) => (
                              <li key={aIdx} className="flex items-start gap-2 text-sm text-white/60 font-kaiti italic">
                                <span className="text-gold mt-0.5">✦</span>
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="bg-gold/5 p-4 rounded-sm border border-gold/10">
                        {[
                          { key: 'morning', label: t(translations.plans.meal_morning), val: mealMorning },
                          { key: 'lunch',   label: t(translations.plans.meal_lunch),   val: mealLunch },
                          { key: 'dinner',  label: t(translations.plans.meal_dinner),  val: mealDinner },
                        ].map(({ key, label, val }) => (
                          <div key={key} className="flex justify-between border-b border-white/5 last:border-0 py-2 text-sm">
                            <span className="text-white/30 uppercase tracking-widest font-display text-[10px]">{label}</span>
                            <span className="text-white/70 font-kaiti italic">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section 5: Conclusion ── */}
        {conclusion && (
          <section className="py-12 border-b border-white/5">
            <div className="flex items-center gap-8 mb-8">
              <h2 className="section-title">{CONCLUSION_TITLE[lang]}</h2>
              <div className="h-[1px] flex-1 bg-gold/20" />
            </div>
            <p className="font-kaiti italic text-white/70 text-lg leading-relaxed max-w-3xl">
              {conclusion}
            </p>
          </section>
        )}

        {/* ── Section 6: Budget Overview ── */}
        {plan.budgetItems.length > 0 && (
          <section className="py-8">
            <div className="flex items-center gap-8 mb-10">
              <h2 className="section-title">{t(translations.plans.budget_overview)}</h2>
              <div className="h-[1px] flex-1 bg-gold/20" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="p-3 border border-white/10 font-display text-gold text-[10px] uppercase tracking-widest">
                      {lang === 'zh' ? '项目' : lang === 'ja' ? '項目' : 'Item'}
                    </th>
                    <th className="p-3 border border-white/10 font-display text-gold text-[10px] uppercase tracking-widest">
                      {lang === 'zh' ? '金额' : lang === 'ja' ? '金額' : 'Amount'}
                    </th>
                    <th className="p-3 border border-white/10 font-display text-gold text-[10px] uppercase tracking-widest">
                      {lang === 'zh' ? '说明' : lang === 'ja' ? '説明' : 'Description'}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white/60 font-kaiti italic">
                  {plan.budgetItems.map((item) => {
                    const cat  = lang === 'zh' ? item.categoryZh : lang === 'ja' ? item.categoryJa : item.categoryEn;
                    const note = lang === 'zh' ? item.noteZh     : lang === 'ja' ? item.noteJa     : item.noteEn;
                    return (
                      <tr key={item.id} className="border-b border-white/5">
                        <td className="p-3 border border-white/10 font-bold text-white not-italic font-sans">{cat}</td>
                        <td className="p-3 border border-white/10 text-gold font-display font-bold not-italic">{item.amount}</td>
                        <td className="p-3 border border-white/10">{note}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gold/10">
                    <td className="p-3 border border-white/10 font-display text-gold font-bold text-sm uppercase tracking-wider">
                      {lang === 'zh' ? '合计' : lang === 'ja' ? '合計' : 'Total'}
                    </td>
                    <td className="p-3 border border-white/10 font-display text-gold font-bold text-lg">
                      {budgetTotal ?? plan.price}
                    </td>
                    <td className="p-3 border border-white/10 text-white/30 text-[11px] font-display not-italic">
                      {t(translations.plans.per_person)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Back */}
        <div className="pt-8 border-t border-white/5 flex flex-wrap gap-3 sm:gap-4">
          <Link href="/plans" className="luxury-btn-outline">
            ← Back
          </Link>
          <button className="luxury-btn">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
