'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video';
  category: string;
}

interface PlanEntry {
  id: string;
  titleZh: string; titleJa: string; titleEn: string;
  duration: number;
  price: string;
  tagZh: string; tagJa: string; tagEn: string;
  coverImage: string;
  visible: boolean;
  budgetTotalZh: string | null;
  budgetTotalJa: string | null;
  budgetTotalEn: string | null;
}

// Placeholder gradient backgrounds shown when no images are uploaded yet
const heroGradients = [
  'from-[#0a0a0a] via-[#1a1208] to-[#0a0a0a]',
  'from-[#050505] via-[#0d1a0d] to-[#050505]',
  'from-[#0a0a0a] via-[#1a1010] to-[#0a0a0a]',
];

const featureItems = [
  {
    key: 'private',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    key: 'nature',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    key: 'asama',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'service',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

// ─── Placeholder slide shown when hero has no images ─────────────────────────
function PlaceholderSlide({ gradientClass }: { gradientClass: string }) {
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
      <div className="text-center">
        <div className="w-16 h-16 border border-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-gold/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-display text-white/10 text-[10px] tracking-[0.6em] uppercase">
          Upload hero images via Admin
        </p>
      </div>
    </div>
  );
}

// ─── Placeholder image cell ───────────────────────────────────────────────────
function PlaceholderCell({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/2 flex items-center justify-center">
      <span className="font-display text-gold/20 text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function HomePage() {
  const { t, language } = useLanguage();
  const lang = language as 'zh' | 'ja' | 'en';
  const base    = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const apiBase = base + '/api';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages]     = useState<MediaItem[]>([]);
  const [hotelImages, setHotelImages]   = useState<MediaItem[]>([]);
  const [surroundingsImages, setSurroundingsImages] = useState<MediaItem[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [plans, setPlans]       = useState<PlanEntry[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ─── Fetch layout, media and plans on mount ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [layoutRes, allImgRes, videoRes, plansRes] = await Promise.all([
          fetch(apiBase + '/layouts'),
          fetch(apiBase + '/media/images'),
          fetch(apiBase + '/media/videos'),
          fetch(apiBase + '/plans?public=1'),
        ]);
        const layout: Record<string, string[]> = layoutRes.ok ? await layoutRes.json() : {};
        const allImgs: MediaItem[]  = allImgRes.ok ? await allImgRes.json() : [];
        const videos: MediaItem[]   = videoRes.ok  ? await videoRes.json()  : [];
        const plansData: PlanEntry[] = plansRes.ok ? await plansRes.json()  : [];

        // Map layout URL arrays to MediaItem objects
        const urlToItem = (url: string) => allImgs.find((img) => img.url === url) ?? { id: url, url, name: '', type: 'image' as const, category: '' };
        setHeroImages((layout['home.hero'] ?? []).map(urlToItem));
        setHotelImages((layout['home.hotel'] ?? []).map(urlToItem));
        setSurroundingsImages((layout['home.surroundings'] ?? []).map(urlToItem));
        if (videos.length > 0) setVideoSrc(videos[0].url);
        setPlans(plansData);
      } catch {
        // Use placeholders when API is not available
      }
    };
    load();
  }, []);

  // ─── Auto-advance slideshow ─────────────────────────────────────────────────
  const slideCount = heroImages.length || heroGradients.length;
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideCount]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getHotelImage = (idx: number) =>
    hotelImages.length > idx ? hotelImages[idx] : null;

  const getPlanTitle = (p: PlanEntry) =>
    lang === 'zh' ? p.titleZh : lang === 'ja' ? p.titleJa : p.titleEn;

  const getPlanTag = (p: PlanEntry) =>
    lang === 'zh' ? p.tagZh : lang === 'ja' ? p.tagJa : p.tagEn;

  const getPlanTotal = (p: PlanEntry) =>
    (lang === 'zh' ? p.budgetTotalZh : lang === 'ja' ? p.budgetTotalJa : p.budgetTotalEn) ?? p.price;

  const slides = heroImages.length > 0 ? heroImages : heroGradients.map((g, i) => ({ id: `p${i}`, gradient: g }));

  return (
    <div className="min-h-screen bg-dark">
      {/* ===== HERO SECTION ===== */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Slideshow */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {'url' in slide ? (
              /* Uploaded image */
              <div className="relative w-full h-full">
                <Image
                  src={(slide as MediaItem).url}
                  alt={`Terrace Villa Foresta Asama ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover brightness-50 animate-kenburns"
                  priority={idx === 0}
                />
              </div>
            ) : (
              /* Gradient placeholder */
              <PlaceholderSlide gradientClass={(slide as { gradient: string }).gradient} />
            )}
          </div>
        ))}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-dark/90" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-20">
          <div className="flex items-center gap-4 mb-6 animate-fade-in-up">
            <div className="gold-line" />
            <span className="text-gold text-xs tracking-[0.6em] font-display uppercase">
              Karuizawa · Japan
            </span>
            <div className="gold-line" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-4 uppercase animate-fade-in-up delay-100">
            Terrace Villa
          </h1>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gold tracking-widest mb-8 uppercase animate-fade-in-up delay-200">
            Foresta Asama
          </h2>

          <div className="gold-divider w-64 mb-8 animate-fade-in-up delay-200" />

          <p className="font-kaiti italic text-gold-light text-lg md:text-xl leading-relaxed max-w-2xl mb-4 animate-fade-in-up delay-300">
            {t(translations.top.tagline)}
          </p>
          <p className="font-kaiti italic text-white/50 text-base leading-relaxed max-w-xl mb-10 animate-fade-in-up delay-400">
            {t(translations.top.subtitle)}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-500">
            <Link href={base + '/library'} className="luxury-btn">
              Explore the Villa
            </Link>
            <Link href={base + '/plans'} className="luxury-btn-outline">
              Travel Plans
            </Link>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 ${
                idx === currentSlide ? 'w-8 h-1 bg-gold' : 'w-2 h-1 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 hidden sm:flex flex-col items-center gap-2 text-white/20">
          <div className="writing-vertical-rl text-[10px] tracking-[0.4em] font-display uppercase">
            Scroll
          </div>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent animate-bounce" />
        </div>
      </section>

      {/* ===== HOTEL INTRO SECTION ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="gold-line" />
                <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">
                  The Villa
                </span>
              </div>
              <h2 className="section-title mb-6">{t(translations.top.intro_title)}</h2>
              <div className="gold-divider mb-8" />
              <p className="font-kaiti italic text-white/70 text-lg leading-relaxed mb-8">
                {t(translations.top.intro_text)}
              </p>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { num: '4',      label: { zh: '独立别墅', ja: '独立ヴィラ',  en: 'Private Villas' } },
                  { num: '1,000m', label: { zh: '海拔高度', ja: '標高',        en: 'Elevation' } },
                  { num: '24h',    label: { zh: '管家服务', ja: 'バトラー',     en: 'Butler Service' } },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center border border-white/5 p-4">
                    <div className="font-display text-2xl font-bold text-gold mb-1">{stat.num}</div>
                    <div className="font-kaiti italic text-white/40 text-xs leading-relaxed">
                      {t(stat.label)}
                    </div>
                  </div>
                ))}
              </div>

              <Link href={base + '/library'} className="luxury-btn-outline">
                {t(translations.common.view_all)}
              </Link>
            </div>

            {/* Image Grid — shows uploaded hotel images or placeholders */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left tall image */}
              <div className="relative aspect-[3/4] overflow-hidden border border-white/10">
                {getHotelImage(0) ? (
                  <Image
                    src={getHotelImage(0)!.url}
                    alt={getHotelImage(0)!.name}
                    fill
                    unoptimized
                    className="object-cover animate-kenburns"
                  />
                ) : (
                  <PlaceholderCell label="Interior" />
                )}
              </div>

              {/* Right: two stacked images */}
              <div className="grid grid-rows-2 gap-4">
                <div className="relative aspect-square overflow-hidden border border-white/10">
                  {getHotelImage(1) ? (
                    <Image
                      src={getHotelImage(1)!.url}
                      alt={getHotelImage(1)!.name}
                      fill
                      unoptimized
                      className="object-cover animate-kenburns-reverse"
                    />
                  ) : (
                    <PlaceholderCell label="Terrace" />
                  )}
                </div>
                <div className="relative aspect-square overflow-hidden border border-white/10">
                  {getHotelImage(2) ? (
                    <Image
                      src={getHotelImage(2)!.url}
                      alt={getHotelImage(2)!.name}
                      fill
                      unoptimized
                      className="object-cover animate-kenburns"
                    />
                  ) : (
                    <PlaceholderCell label="Asama" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-16 px-6 bg-white/2 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureItems.map((item) => {
              const featureData = translations.top.features[item.key as keyof typeof translations.top.features];
              return (
                <div
                  key={item.key}
                  className="flex flex-col items-center text-center p-8 border border-white/5 hover:border-gold/20 transition-all duration-500 group"
                >
                  <div className="text-gold/60 group-hover:text-gold mb-4 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <div className="w-8 h-[1px] bg-gold/20 group-hover:bg-gold/40 transition-colors duration-300 mb-4" />
                  <h3 className="font-display text-sm font-bold text-white tracking-widest uppercase mb-2">
                    {t(featureData.title)}
                  </h3>
                  <p className="font-kaiti italic text-white/40 text-sm leading-relaxed">
                    {t(featureData.desc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== VIDEO SECTION ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="gold-line" />
              <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Experience</span>
              <div className="gold-line" />
            </div>
            <h2 className="section-title mb-4">{t(translations.top.video_title)}</h2>
            <div className="gold-divider w-48 mx-auto" />
          </div>

          <div className="relative aspect-video w-full max-w-5xl mx-auto overflow-hidden border border-white/10">
            {videoSrc ? (
              <video
                ref={videoRef}
                key={videoSrc}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="auto"
              >
                <source src={videoSrc} type="video/mp4" />
                <source src={videoSrc} type="video/webm" />
              </video>
            ) : (
              /* Placeholder when no video is uploaded */
              <div className="absolute inset-0 bg-gradient-to-br from-dark to-dark-secondary flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gold/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="font-display text-white/20 text-xs tracking-widest uppercase">
                    Upload a video via Admin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== PLANS PREVIEW SECTION ===== */}
      <section className="py-24 px-6 bg-white/2 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="gold-line" />
              <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">
                Curated Experiences
              </span>
              <div className="gold-line" />
            </div>
            <h2 className="section-title mb-4">{t(translations.plans.title)}</h2>
            <div className="gold-divider w-48 mx-auto mb-6" />
            <p className="section-subtitle max-w-xl mx-auto">{t(translations.plans.subtitle)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {plans.slice(0, 3).map((plan) => {
              const tag = getPlanTag(plan);
              const coverSrc = plan.coverImage || `/images/plans/${plan.id}.jpg`;
              return (
                <Link href={`/plans/${plan.id}`} key={plan.id} className="luxury-card group block overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                    <Image
                      src={coverSrc}
                      alt={getPlanTitle(plan)}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
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
                  <div className="p-6">
                    <h3 className="font-serif text-white text-xl font-bold mb-2 group-hover:text-gold transition-colors duration-300">
                      {getPlanTitle(plan)}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-gold font-display text-sm font-bold">
                        {getPlanTotal(plan)}{' '}
                        <span className="text-white/40 text-[10px]">{t(translations.plans.per_person)}</span>
                      </span>
                      <span className="text-white/40 text-xs font-display uppercase tracking-widest group-hover:text-gold transition-colors duration-300">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link href={base + '/plans'} className="luxury-btn-outline">
              {t(translations.common.view_all)}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SURROUNDINGS PREVIEW ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="gold-line" />
                <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Karuizawa</span>
              </div>
              <h2 className="section-title mb-6">{t(translations.surroundings.title)}</h2>
              <div className="gold-divider mb-8" />
              <p className="font-kaiti italic text-white/60 text-lg leading-relaxed mb-8">
                {t(translations.surroundings.karuizawa_intro)}
              </p>
              <Link href={base + '/surroundings'} className="luxury-btn-outline">
                {t(translations.common.view_all)}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['nature', 'culture', 'gourmet', 'shopping'] as const).map((cat, idx) => {
                const img = surroundingsImages[idx] ?? surroundingsImages[0] ?? null;
                return (
                  <div
                    key={cat}
                    className="relative aspect-square overflow-hidden bg-white/5 border border-white/5 hover:border-gold/20 transition-all duration-500 flex items-center justify-center group cursor-pointer"
                  >
                    {img ? (
                      <Image src={img.url} alt={cat} fill unoptimized className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                    ) : null}
                    <div className="relative text-center p-4">
                      <div className="text-white/40 group-hover:text-gold/60 font-display text-xs uppercase tracking-widest transition-colors duration-300">
                        {t(translations.surroundings.categories[cat])}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
