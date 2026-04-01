'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

type Lang = 'zh' | 'ja' | 'en';

interface Spot {
  id: string;
  category: string;
  nameZh: string; nameJa: string; nameEn: string;
  descriptionZh: string; descriptionJa: string; descriptionEn: string;
  distance: number;
  imageUrl: string;
  tagsZh: string[]; tagsJa: string[]; tagsEn: string[];
  visible: boolean;
}

const CATEGORIES = ['all', 'nature', 'culture', 'gourmet', 'shopping', 'activity'] as const;

export default function SurroundingsPage() {
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const apiBase = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/api';
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(apiBase + '/surroundings')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSpots(d))
      .catch(() => {});
  }, []);

  const filtered =
    activeCategory === 'all'
      ? spots
      : spots.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="gold-line"></div>
                <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">
                  Karuizawa
                </span>
              </div>
              <h1 className="section-title mb-4">
                {t(translations.surroundings.title)}
              </h1>
              <div className="gold-divider mb-6" />
              <p className="section-subtitle mb-8">
                {t(translations.surroundings.subtitle)}
              </p>
              <p className="font-kaiti italic text-white/50 text-base leading-relaxed">
                {t(translations.surroundings.karuizawa_intro)}
              </p>
            </div>

            {/* Karuizawa Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '1,000m', label: { zh: '平均海拔', ja: '平均標高', en: 'Average Elevation' } },
                { num: '1867',   label: { zh: '开拓年份', ja: '開拓年',   en: 'Year Founded' } },
                { num: '~16°C', label: { zh: '夏季均温', ja: '夏の平均気温', en: 'Summer Avg Temp' } },
                { num: '100+',   label: { zh: '历史建筑', ja: '歴史的建築物', en: 'Historic Buildings' } },
              ].map((stat, idx) => (
                <div key={idx} className="border border-white/5 p-4 sm:p-6 text-center hover:border-gold/20 transition-all duration-300">
                  <div className="font-display text-2xl font-bold text-gold mb-2">{stat.num}</div>
                  <div className="font-kaiti italic text-white/40 text-xs">{t(stat.label)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 sm:px-6 mb-8 sm:mb-12 border-t border-white/5 pt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 font-display text-xs uppercase tracking-[0.3em] transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-gold text-black font-bold'
                    : 'border border-white/10 text-white/40 hover:border-gold/30 hover:text-gold'
                }`}
              >
                {cat === 'all'
                  ? (lang === 'zh' ? '全部' : lang === 'ja' ? 'すべて' : 'All')
                  : t(translations.surroundings.categories[cat as keyof typeof translations.surroundings.categories])}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Spots Grid */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <p className="text-white/20 text-xs font-display uppercase tracking-widest text-center py-16">
              {lang === 'zh' ? '暂无景点' : lang === 'ja' ? 'スポットなし' : 'No spots'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((spot) => {
                const name = lang === 'zh' ? spot.nameZh : lang === 'ja' ? spot.nameJa : spot.nameEn;
                const desc = lang === 'zh' ? spot.descriptionZh : lang === 'ja' ? spot.descriptionJa : spot.descriptionEn;
                const tags = lang === 'zh' ? spot.tagsZh : lang === 'ja' ? spot.tagsJa : spot.tagsEn;
                const hasValidImage = !imageErrors[spot.id] &&
                  (spot.imageUrl.startsWith('http') || spot.imageUrl.startsWith('/uploads'));
                return (
                  <div key={spot.id} className="luxury-card group overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                      {hasValidImage ? (
                        <Image
                          src={spot.imageUrl}
                          alt={name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={() => setImageErrors((prev) => ({ ...prev, [spot.id]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                          <span className="font-display text-white/10 text-xs uppercase tracking-widest">{spot.id}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/70 to-transparent" />

                      {/* Distance badge */}
                      <div className="absolute top-3 right-3 bg-dark/80 border border-gold/20 px-2 py-1">
                        <span className="font-display text-gold text-[10px] uppercase tracking-widest">
                          {t(translations.surroundings.distance)} {spot.distance}
                          {t(translations.surroundings.minutes)}
                        </span>
                      </div>

                      {/* Category badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="font-display text-[10px] uppercase tracking-widest text-white/50">
                          {t(translations.surroundings.categories[spot.category as keyof typeof translations.surroundings.categories])}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      <h3 className="font-serif text-white text-xl font-bold mb-3 group-hover:text-gold transition-colors duration-300">
                        {name}
                      </h3>
                      <p className="font-kaiti italic text-white/50 text-sm leading-relaxed mb-4">
                        {desc}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, idx) => (
                          <span key={idx} className="border border-gold/20 text-gold/60 px-2 py-0.5 text-[10px] font-display uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Map Section */}
      <section className="px-6 py-16 bg-white/2 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="gold-line"></div>
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Location</span>
            <div className="gold-line"></div>
          </div>
          <h2 className="section-title mb-4">
            {lang === 'zh' ? '交通指引' : lang === 'ja' ? '交通案内' : 'Getting There'}
          </h2>
          <div className="gold-divider w-48 mx-auto mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '🚄', title: { zh: '新干线',   ja: '新幹線',   en: 'Shinkansen'  }, desc: { zh: '东京 → 轻井泽 约72分钟', ja: '東京 → 軽井沢 約72分',       en: 'Tokyo → Karuizawa ~72 min'    } },
              { icon: '🚗', title: { zh: '高速公路', ja: '高速道路', en: 'Highway'     }, desc: { zh: '东京 → 轻井泽 约2.5小时', ja: '東京 → 軽井沢 約2.5時間', en: 'Tokyo → Karuizawa ~2.5 hours' } },
              { icon: '✈️', title: { zh: '直升机',   ja: 'ヘリコプター', en: 'Helicopter'  }, desc: { zh: '定制包机服务可预约',       ja: 'チャーター便予約可能',           en: 'Charter service available'    } },
            ].map((item, idx) => (
              <div key={idx} className="border border-white/5 p-4 sm:p-6 text-center hover:border-gold/20 transition-all duration-300">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-display text-gold text-sm uppercase tracking-widest mb-2">{t(item.title)}</h3>
                <p className="font-kaiti italic text-white/40 text-sm">{t(item.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
