'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

type Lang = 'zh' | 'ja' | 'en';

interface Spot {
  id: string;
  category: string;
  name: { zh: string; ja: string; en: string };
  description: { zh: string; ja: string; en: string };
  distance: number;
  image: string;
  tags: { zh: string; ja: string; en: string }[];
}

const spots: Spot[] = [
  // Nature
  {
    id: 'shiraito',
    category: 'nature',
    name: { zh: '白丝瀑布', ja: '白糸の滝', en: 'Shiraito Falls' },
    description: {
      zh: '日本三大瀑布之一，如白丝般细腻流淌的美丽瀑布，四季各有不同魅力。',
      ja: '日本三大瀑布のひとつ、白糸のように繊細に流れる美しい滝で、四季それぞれに異なる魅力があります。',
      en: 'One of Japan\'s three great waterfalls, flowing delicately like white silk with unique charm in each season.',
    },
    distance: 15,
    image: '/images/surroundings/shiraito.jpg',
    tags: [
      { zh: '自然景观', ja: '自然景観', en: 'Natural Scenery' },
      { zh: '徒步', ja: 'ハイキング', en: 'Hiking' },
    ],
  },
  {
    id: 'asama',
    category: 'nature',
    name: { zh: '浅间山', ja: '浅間山', en: 'Mt. Asama' },
    description: {
      zh: '日本最活跃的火山之一，雄伟的姿态与神秘的云雾构成绝美的自然景观。',
      ja: '日本で最も活発な火山のひとつで、雄大な姿と神秘的な霧が絶美な自然景観を作り出しています。',
      en: 'One of Japan\'s most active volcanoes, its majestic form and mysterious mist create a breathtaking natural landscape.',
    },
    distance: 5,
    image: '/images/surroundings/asama.jpg',
    tags: [
      { zh: '火山景观', ja: '火山景観', en: 'Volcanic Scenery' },
      { zh: '摄影', ja: '写真', en: 'Photography' },
    ],
  },
  {
    id: 'kumoba',
    category: 'nature',
    name: { zh: '云场池', ja: '雲場池', en: 'Kumoba Pond' },
    description: {
      zh: '被誉为"轻井泽之眼"，秋季红叶倒映水中，如诗如画。',
      ja: '「軽井沢の瞳」と称されるこの池は、秋の紅葉が水面に映り、詩のような絵画のような美しさです。',
      en: 'Known as the "Eye of Karuizawa", autumn foliage reflected on the water creates a poetic, painting-like beauty.',
    },
    distance: 8,
    image: '/images/surroundings/kumoba.jpg',
    tags: [
      { zh: '季节景色', ja: '季節の景色', en: 'Seasonal Scenery' },
      { zh: '散步', ja: '散歩', en: 'Walking' },
    ],
  },
  // Culture
  {
    id: 'stone-church',
    category: 'culture',
    name: { zh: '石之教堂', ja: '石の教会', en: 'Stone Church' },
    description: {
      zh: '建筑师肯德里克·班斯的杰作，以自然石材和玻璃构成的现代主义教堂，与自然融为一体。',
      ja: '建築家ケンドリック・バンスの傑作で、天然石とガラスで構成されたモダニズムの教会が自然と一体化しています。',
      en: 'A masterpiece by architect Kendrick Bangs, this modernist church of natural stone and glass merges with nature.',
    },
    distance: 10,
    image: '/images/surroundings/stone-church.jpg',
    tags: [
      { zh: '建筑艺术', ja: '建築芸術', en: 'Architecture' },
      { zh: '文化遗产', ja: '文化遺産', en: 'Cultural Heritage' },
    ],
  },
  {
    id: 'sezon-museum',
    category: 'culture',
    name: { zh: '軽井泽现代美术馆', ja: '軽井沢現代美術館', en: 'Karuizawa Museum of Modern Art' },
    description: {
      zh: '收藏包括毕加索、达利等世界名家作品，森林包围中的艺术殿堂。',
      ja: 'ピカソやダリなどの世界的巨匠の作品を収蔵する、森に囲まれた芸術の殿堂です。',
      en: 'Housing works by world masters including Picasso and Dali, an art temple surrounded by forest.',
    },
    distance: 12,
    image: '/images/surroundings/museum.jpg',
    tags: [
      { zh: '艺术', ja: '芸術', en: 'Art' },
      { zh: '室内景点', ja: '屋内スポット', en: 'Indoor Attraction' },
    ],
  },
  {
    id: 'ginza',
    category: 'shopping',
    name: { zh: '旧银座商店街', ja: '旧軽銀座商店街', en: 'Old Ginza Shopping Street' },
    description: {
      zh: '拥有百年历史的购物街，汇集了轻井泽知名品牌、工艺品和特色美食，漫步其中感受轻井泽的悠久历史。',
      ja: '百年の歴史を誇るショッピングストリートで、軽井沢の有名ブランド、工芸品、特色グルメが集まっています。',
      en: 'A shopping street with centennial history, gathering Karuizawa\'s famous brands, crafts, and specialty foods.',
    },
    distance: 10,
    image: '/images/surroundings/ginza.jpg',
    tags: [
      { zh: '购物', ja: 'ショッピング', en: 'Shopping' },
      { zh: '特产', ja: '特産品', en: 'Local Specialties' },
    ],
  },
  {
    id: 'hoshino-onsen',
    category: 'activity',
    name: { zh: '星野温泉蜻蜓之汤', ja: '星野温泉 とんぼの湯', en: 'Hoshino Onsen Tonbo-no-yu' },
    description: {
      zh: '轻井泽最负盛名的温泉设施，泡汤同时欣赏森林美景，彻底放松身心。',
      ja: '軽井沢で最も有名な温泉施設で、森の美景を眺めながら入浴し、心身を完全にリラックスできます。',
      en: 'Karuizawa\'s most famous onsen facility, relax completely while enjoying forest views.',
    },
    distance: 5,
    image: '/images/surroundings/onsen.jpg',
    tags: [
      { zh: '温泉', ja: '温泉', en: 'Onsen' },
      { zh: '放松', ja: 'リラクゼーション', en: 'Relaxation' },
    ],
  },
  {
    id: 'harunire',
    category: 'shopping',
    name: { zh: '榆树街小镇', ja: 'ハルニレテラス', en: 'Harunire Terrace' },
    description: {
      zh: '依偎在古老榆树群中的精品商业空间，包含餐厅、咖啡馆和精选商店，是轻井泽最受欢迎的休闲场所之一。',
      ja: '古いハルニレの木立に囲まれたブティック商業空間で、レストラン、カフェ、厳選ショップを含む軽井沢で最人気の憩いの場です。',
      en: 'A boutique commercial space nestled among old elm trees, featuring restaurants, cafes, and selected shops.',
    },
    distance: 5,
    image: '/images/surroundings/harunire.jpg',
    tags: [
      { zh: '购物', ja: 'ショッピング', en: 'Shopping' },
      { zh: '餐饮', ja: 'グルメ', en: 'Dining' },
    ],
  },
  // Gourmet
  {
    id: 'gourmet-french',
    category: 'gourmet',
    name: { zh: '轻井泽法式餐厅', ja: '軽井沢フレンチレストラン', en: 'Karuizawa French Restaurant' },
    description: {
      zh: '汇聚日本顶级法式料理大师，在轻井泽的自然环境中享受一流的欧陆风情。',
      ja: '日本トップクラスのフレンチシェフが集まり、軽井沢の自然環境の中でトップクラスのヨーロッパ料理を楽しめます。',
      en: 'Gathering Japan\'s top French cuisine masters, enjoy first-class European cuisine in Karuizawa\'s natural setting.',
    },
    distance: 8,
    image: '/images/surroundings/french.jpg',
    tags: [
      { zh: '法式料理', ja: 'フレンチ', en: 'French Cuisine' },
      { zh: '高端餐饮', ja: '高級グルメ', en: 'Fine Dining' },
    ],
  },
];

const CATEGORIES = ['all', 'nature', 'culture', 'gourmet', 'shopping', 'activity'] as const;

export default function SurroundingsPage() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [spotImageUrls, setSpotImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/layouts')
      .then((r) => r.ok ? r.json() : {})
      .then((layout: Record<string, string[]>) => {
        const urls = layout['surroundings.spots'] ?? [];
        if (urls.length > 0) setSpotImageUrls(urls);
      })
      .catch(() => {});
  }, []);

  const filtered =
    activeCategory === 'all'
      ? spots
      : spots.filter((s) => s.category === activeCategory);

  const lang = language as Lang;

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
                { num: '1867', label: { zh: '开拓年份', ja: '開拓年', en: 'Year Founded' } },
                { num: '~16°C', label: { zh: '夏季均温', ja: '夏の平均気温', en: 'Summer Avg Temp' } },
                { num: '100+', label: { zh: '历史建筑', ja: '歴史的建築物', en: 'Historic Buildings' } },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="border border-white/5 p-4 sm:p-6 text-center hover:border-gold/20 transition-all duration-300"
                >
                  <div className="font-display text-2xl font-bold text-gold mb-2">
                    {stat.num}
                  </div>
                  <div className="font-kaiti italic text-white/40 text-xs">
                    {t(stat.label)}
                  </div>
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
                  ? (language === 'zh' ? '全部' : language === 'ja' ? 'すべて' : 'All')
                  : t(translations.surroundings.categories[cat as keyof typeof translations.surroundings.categories])}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Spots Grid */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((spot) => {
              const spotIdx = spots.indexOf(spot);
              const spotImage = spotImageUrls[spotIdx] ?? spot.image;
              return (
              <div key={spot.id} className="luxury-card group overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                  {!imageErrors[spot.id] ? (
                    <Image
                      src={spotImage}
                      alt={spot.name[lang]}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={() =>
                        setImageErrors((prev) => ({ ...prev, [spot.id]: true }))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                      <span className="font-display text-white/10 text-xs uppercase tracking-widest">
                        {spot.id}
                      </span>
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
                    {spot.name[lang]}
                  </h3>
                  <p className="font-kaiti italic text-white/50 text-sm leading-relaxed mb-4">
                    {spot.description[lang]}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {spot.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="border border-gold/20 text-gold/60 px-2 py-0.5 text-[10px] font-display uppercase tracking-widest"
                      >
                        {tag[lang]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="px-6 py-16 bg-white/2 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="gold-line"></div>
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">
              Location
            </span>
            <div className="gold-line"></div>
          </div>
          <h2 className="section-title mb-4">
            {language === 'zh' ? '交通指引' : language === 'ja' ? '交通案内' : 'Getting There'}
          </h2>
          <div className="gold-divider w-48 mx-auto mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: '🚄',
                title: { zh: '新干线', ja: '新幹線', en: 'Shinkansen' },
                desc: { zh: '东京 → 轻井泽 约72分钟', ja: '東京 → 軽井沢 約72分', en: 'Tokyo → Karuizawa ~72 min' },
              },
              {
                icon: '🚗',
                title: { zh: '高速公路', ja: '高速道路', en: 'Highway' },
                desc: { zh: '东京 → 轻井泽 约2.5小时', ja: '東京 → 軽井沢 約2.5時間', en: 'Tokyo → Karuizawa ~2.5 hours' },
              },
              {
                icon: '✈️',
                title: { zh: '直升机', ja: 'ヘリコプター', en: 'Helicopter' },
                desc: { zh: '定制包机服务可预约', ja: 'チャーター便予約可能', en: 'Charter service available' },
              },
            ].map((item, idx) => (
              <div key={idx} className="border border-white/5 p-4 sm:p-6 text-center hover:border-gold/20 transition-all duration-300">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-display text-gold text-sm uppercase tracking-widest mb-2">
                  {t(item.title)}
                </h3>
                <p className="font-kaiti italic text-white/40 text-sm">{t(item.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
