'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  category: string;
  type: 'image' | 'video';
}

// Category labels matching the admin upload categories
const CATEGORIES = [
  { value: 'all',          label: { zh: '全部',     ja: 'すべて',     en: 'All' } },
  { value: 'hotel',        label: { zh: '酒店介绍', ja: 'ホテル紹介', en: 'Hotel' } },
  { value: 'surroundings', label: { zh: '周边介绍', ja: '周辺紹介',   en: 'Surroundings' } },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]['value'];

export default function LibraryPage() {
  const { t } = useLanguage();
  const base    = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const apiBase = base + '/api';
  const [activeCategory, setActiveCategory] = useState<CategoryValue>('all');
  const [images, setImages]                 = useState<MediaItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [lightboxOpen, setLightboxOpen]     = useState(false);
  const [lightboxIndex, setLightboxIndex]   = useState(0);
  const [imageErrors, setImageErrors]       = useState<Record<string, boolean>>({});

  // ─── Fetch gallery images from layout API ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [layoutRes, allImgRes] = await Promise.all([
          fetch(apiBase + '/layouts'),
          fetch(apiBase + '/media/images'),
        ]);
        const layout: Record<string, string[]> = layoutRes.ok ? await layoutRes.json() : {};
        const allImgs: MediaItem[] = allImgRes.ok ? await allImgRes.json() : [];
        const urlToItem = (url: string): MediaItem | undefined => allImgs.find((img) => img.url === url);
        const hotelUrls = layout['gallery.hotel'] ?? [];
        const srndUrls  = layout['gallery.surroundings'] ?? [];
        const hotel     = hotelUrls.map(urlToItem).filter(Boolean).map((img) => ({ ...img!, category: 'hotel' }));
        const srnd      = srndUrls.map(urlToItem).filter(Boolean).map((img) => ({ ...img!, category: 'surroundings' }));
        setImages([...hotel, ...srnd]);
      } catch {
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Filter by selected section ──────────────────────────────────────────
  const filtered =
    activeCategory === 'all'
      ? images
      : images.filter((img) => img.category === activeCategory);

  // ─── Lightbox ─────────────────────────────────────────────────────────────
  const openLightbox  = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImage     = useCallback(() => setLightboxIndex((p) => (p - 1 + filtered.length) % filtered.length), [filtered.length]);
  const nextImage     = useCallback(() => setLightboxIndex((p) => (p + 1) % filtered.length), [filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowLeft')  prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, prevImage, nextImage]);

  const lang = useLanguage().language as 'zh' | 'ja' | 'en';

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="gold-line" />
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">
              Visual Stories
            </span>
            <div className="gold-line" />
          </div>
          <h1 className="section-title mb-4">{t(translations.library.title)}</h1>
          <div className="gold-divider w-48 mx-auto mb-6" />
          <p className="section-subtitle max-w-xl mx-auto">
            {t(translations.library.subtitle)}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-5 py-2 font-display text-xs uppercase tracking-[0.3em] transition-all duration-300 ${
                  activeCategory === cat.value
                    ? 'bg-gold text-black font-bold'
                    : 'border border-white/10 text-white/40 hover:border-gold/30 hover:text-gold'
                }`}
              >
                {cat.label[lang]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Masonry Gallery */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            /* Loading state */
            <div className="text-center py-24">
              <div className="text-gold/40 font-display text-xs uppercase tracking-widest animate-pulse">
                {t(translations.common.loading)}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="text-center py-24 border border-white/5">
              <div className="w-16 h-16 border border-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gold/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-kaiti italic text-white/20 mb-4">
                {lang === 'zh' ? '暂无图片' : lang === 'ja' ? '画像がありません' : 'No images yet'}
              </p>
              <a href={base + '/admin'} className="text-gold/40 hover:text-gold text-[10px] font-display uppercase tracking-widest transition-colors duration-300">
                {lang === 'zh' ? '前往管理画面上传' : lang === 'ja' ? '管理画面でアップロード' : 'Upload via Admin →'}
              </a>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
              {filtered.map((img, idx) => (
                <div
                  key={img.id}
                  className="break-inside-avoid mb-4 relative group cursor-pointer overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-500"
                  onClick={() => openLightbox(idx)}
                >
                  <div className="relative bg-white/5 min-h-[200px]">
                    {!imageErrors[img.id] ? (
                      <Image
                        src={img.url}
                        alt={img.name}
                        width={800}
                        height={600}
                        unoptimized
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={() => setImageErrors((prev) => ({ ...prev, [img.id]: true }))}
                      />
                    ) : (
                      <div className="w-full min-h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                        <svg className="w-10 h-10 text-gold/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-display text-white/10 text-[10px] uppercase tracking-widest">{img.name}</p>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 border border-gold/40 flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                        <p className="font-display text-white/60 text-[10px] uppercase tracking-widest">
                          {CATEGORIES.find((c) => c.value === img.category)?.label[lang] ?? img.category}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && filtered.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div
            className="relative w-full max-w-5xl mx-auto px-8 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ minHeight: '300px' }}>
              {!imageErrors[filtered[lightboxIndex].id] ? (
                <Image
                  src={filtered[lightboxIndex].url}
                  alt={filtered[lightboxIndex].name}
                  width={1200}
                  height={800}
                  unoptimized
                  className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center">
                  <span className="font-display text-white/20 text-sm uppercase tracking-widest">
                    {filtered[lightboxIndex].name}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all duration-300 text-white/60 text-xl"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all duration-300 text-white/60 text-xl"
            >
              ›
            </button>

            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute -top-8 right-8 sm:right-16 text-white/40 hover:text-gold transition-colors duration-300 text-3xl leading-none"
            >
              ×
            </button>

            {/* Info bar */}
            <div className="flex items-center justify-between mt-4">
              <span className="font-kaiti italic text-white/30 text-sm truncate max-w-[60%]">
                {filtered[lightboxIndex].name}
              </span>
              <span className="font-display text-white/30 text-[10px] tracking-widest uppercase">
                {lightboxIndex + 1} / {filtered.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
