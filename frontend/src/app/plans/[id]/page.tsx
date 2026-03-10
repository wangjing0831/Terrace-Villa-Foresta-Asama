'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  category: string;
}

type Lang = 'zh' | 'ja' | 'en';

interface DayPlan {
  title: { zh: string; ja: string; en: string };
  activities: { zh: string; ja: string; en: string }[];
  meals: {
    morning: { zh: string; ja: string; en: string };
    lunch: { zh: string; ja: string; en: string };
    dinner: { zh: string; ja: string; en: string };
  };
}

interface Plan {
  id: string;
  image: string;
  title: { zh: string; ja: string; en: string };
  tagline: { zh: string; ja: string; en: string };
  description: { zh: string; ja: string; en: string };
  duration: number;
  price: string;
  includes: { zh: string; ja: string; en: string }[];
  itinerary: DayPlan[];
  budget: {
    items: {
      category: { zh: string; ja: string; en: string };
      amount: string;
      note: { zh: string; ja: string; en: string };
    }[];
  };
}

const planData: Record<string, Plan> = {
  golf: {
    id: 'golf',
    image: '/images/plans/golf.jpg',
    title: { zh: '高尔夫精英之旅', ja: 'ゴルフエリートの旅', en: 'Golf Elite Journey' },
    tagline: {
      zh: '征服日本顶级球场，体验皇室级奢华',
      ja: '日本最高峰コースを制覇し、ロイヤルクラスの贅沢を体験',
      en: 'Conquer Japan\'s finest courses, experience royal-class luxury',
    },
    description: {
      zh: '此行不仅是一场对顶级绿茵的征服，更是一次深入日本皇室避暑地核心的灵魂洗礼。我们严格筛选了轻井泽最具代表性的五大球场，涵盖了职业赛事地与极秘私享地，确保每一场挥杆都具有非凡意义。',
      ja: 'この旅は単なるトップクラスのグリーンへの挑戦ではなく、日本の皇室避暑地の中核に深く入り込む魂の洗礼でもあります。軽井沢を代表する五大コースを厳選し、プロ試合会場から超秘密のプライベートコースまで、すべてのスウィングに非凡な意味を持たせます。',
      en: 'This journey is not just a conquest of top-tier greens, but a spiritual immersion into the heart of Japan\'s royal summer retreat. We have carefully selected five of Karuizawa\'s most representative courses.',
    },
    duration: 7,
    price: '¥60,000',
    includes: [
      { zh: '6晚 Terrace Villa Foresta Asama 独立别墅住宿', ja: '6泊 Terrace Villa Foresta Asama 独立ヴィラ宿泊', en: '6 nights at Terrace Villa Foresta Asama private villa' },
      { zh: '5场顶级高尔夫球场绿地费', ja: '5ラウンドのトップゴルフコース利用', en: '5 rounds at top golf courses' },
      { zh: '全程专属私人管家服务', ja: '全行程専属プライベートバトラーサービス', en: 'Dedicated private butler throughout' },
      { zh: '每日别墅早餐及指定餐厅晚宴', ja: '毎日ヴィラ朝食と指定レストランディナー', en: 'Daily villa breakfast and designated dinners' },
      { zh: '全程私人豪华专车', ja: '全行程プライベート高級車', en: 'Private luxury transportation throughout' },
    ],
    itinerary: [
      {
        title: { zh: '抵达轻井泽：初遇浅间之美', ja: '軽井沢到着：浅間山との初めての出会い', en: 'Arrival in Karuizawa: First Encounter with Mt. Asama' },
        activities: [
          { zh: '抵达轻井泽车站', ja: '軽井沢駅到着', en: 'Arrive at Karuizawa Station' },
          { zh: '私人专车接送至别墅办理入住', ja: 'プライベート車でヴィラにチェックイン', en: 'Private transfer to villa check-in' },
          { zh: '轻井泽浅间高尔夫球场午后开球', ja: '軽井沢浅間ゴルフ場午後プレー', en: 'Afternoon round at Karuizawa Asama Golf Course' },
        ],
        meals: {
          morning: { zh: '不含', ja: '不含', en: 'Not included' },
          lunch: { zh: '球场精致轻食', ja: 'コース上品なライトミール', en: 'Course refined light meal' },
          dinner: { zh: '别墅内私人主厨和牛晚宴', ja: 'ヴィラ内プライベートシェフ和牛ディナー', en: 'Private chef wagyu dinner in villa' },
        },
      },
      {
        title: { zh: '挑战职业之巅：北场风云', ja: '職業頂点への挑戦：北コースの風雲', en: 'Challenge the Professional Peak: North Course' },
        activities: [
          { zh: '轻井泽72高尔夫北场全天击球', ja: '軽井沢72ゴルフ北コース全日プレー', en: 'Full day at Karuizawa 72 Golf North Course' },
          { zh: '体验女子美巡赛级别的场地品质', ja: '女子ツアーレベルのコース品質を体験', en: 'Experience JLPGA tournament-level course quality' },
        ],
        meals: {
          morning: { zh: '别墅欧式早餐', ja: 'ヴィラ欧式朝食', en: 'Villa European breakfast' },
          lunch: { zh: '北场会所特色定食', ja: '北コースクラブハウス特製定食', en: 'North Course clubhouse set meal' },
          dinner: { zh: '轻井泽高端法式餐厅', ja: '軽井沢高級フレンチレストラン', en: 'Karuizawa high-end French restaurant' },
        },
      },
      {
        title: { zh: '高原呼吸：太平洋俱乐部的壮阔', ja: '高原の息吹：太平洋クラブの壮大さ', en: 'Highland Air: The Grandeur of Taiheiyo Club' },
        activities: [
          { zh: '太平洋俱乐部轻井泽球场挥杆', ja: '太平洋クラブ軽井沢コースプレー', en: 'Round at Taiheiyo Club Karuizawa Course' },
          { zh: '在海拔1300米处感受清爽挥杆', ja: '標高1300mでのさわやかなスウィング体験', en: 'Refreshing swing experience at 1,300m elevation' },
        ],
        meals: {
          morning: { zh: '别墅和式早餐', ja: 'ヴィラ和式朝食', en: 'Villa Japanese breakfast' },
          lunch: { zh: '球场景观餐厅午餐', ja: 'コース景観レストランランチ', en: 'Course view restaurant lunch' },
          dinner: { zh: '当地特色怀石料理', ja: '地元の特別懐石料理', en: 'Local specialty kaiseki cuisine' },
        },
      },
      {
        title: { zh: '漫步云端：轻井泽人文漫游', ja: '雲の上の散歩：軽井沢人文散策', en: 'Strolling the Clouds: Karuizawa Cultural Walk' },
        activities: [
          { zh: '轻井泽旧银座商店街', ja: '軽井沢旧銀座商店街', en: 'Karuizawa Old Ginza Shopping Street' },
          { zh: '白丝瀑布自然巡游', ja: '白糸の滝自然ツアー', en: 'Shiraito Falls nature tour' },
          { zh: '石之教堂与高原教会建筑之美', ja: '石の教会と高原教会建築美', en: 'Stone Church and highland church architecture' },
        ],
        meals: {
          morning: { zh: '别墅精致早餐', ja: 'ヴィラ上品な朝食', en: 'Villa refined breakfast' },
          lunch: { zh: '旧银座百年餐馆', ja: '旧銀座百年レストラン', en: 'Centennial restaurant in Old Ginza' },
          dinner: { zh: '高奢铁板烧料理', ja: '高級鉄板焼き', en: 'Premium teppanyaki cuisine' },
        },
      },
      {
        title: { zh: '皇家传奇：私人俱乐部的荣耀', ja: '王家の伝説：プライベートクラブの栄光', en: 'Royal Legend: Glory of the Private Club' },
        activities: [
          { zh: '轻井泽高尔夫俱乐部（尊享挥杆体验）', ja: '軽井沢ゴルフクラブ（プレミアムスウィング体験）', en: 'Karuizawa Golf Club (premium swing experience)' },
          { zh: '深入感受日本最顶级私人球场的底蕴', ja: '日本最高のプライベートコースの深みを体験', en: 'Immerse in the heritage of Japan\'s finest private course' },
        ],
        meals: {
          morning: { zh: '别墅特制早餐', ja: 'ヴィラ特製朝食', en: 'Villa special breakfast' },
          lunch: { zh: '球场会所高级午餐', ja: 'クラブハウス高級ランチ', en: 'Clubhouse premium lunch' },
          dinner: { zh: '森林意式精品餐厅', ja: '森のイタリアンブティックレストラン', en: 'Forest Italian boutique restaurant' },
        },
      },
      {
        title: { zh: '静谧森林：星野地区的慢生活', ja: '静かな森：星野エリアのスローライフ', en: 'Silent Forest: Slow Life in Hoshino Area' },
        activities: [
          { zh: '榆树街小镇闲逛', ja: 'ハルニレテラス散策', en: 'Harunire Terrace stroll' },
          { zh: '星野温泉蜻蜓之汤洗涤疲劳', ja: '星野温泉 とんぼの湯で疲れを癒す', en: 'Hoshino Onsen Tonbo-no-yu relaxation' },
          { zh: '别墅露台私人下午茶', ja: 'ヴィラテラスでのプライベートアフタヌーンティー', en: 'Private afternoon tea on villa terrace' },
        ],
        meals: {
          morning: { zh: '别墅慢享早餐', ja: 'ヴィラスローブレックファスト', en: 'Villa slow breakfast' },
          lunch: { zh: '村民食堂季节料理', ja: '村民食堂の季節料理', en: 'Villager\'s restaurant seasonal cuisine' },
          dinner: { zh: '顶级河豚或蟹料理专门店', ja: 'トップフグまたはカニ料理専門店', en: 'Top fugu or crab specialty restaurant' },
        },
      },
      {
        title: { zh: '完美收官：东场的终极考验', ja: '完璧なフィナーレ：東コースの究極の挑戦', en: 'Perfect Finale: Ultimate Challenge at East Course' },
        activities: [
          { zh: '轻井泽72高尔夫东场挥杆', ja: '軽井沢72ゴルフ東コースプレー', en: 'Round at Karuizawa 72 Golf East Course' },
          { zh: '购买轻井泽特色伴手礼', ja: '軽井沢の特産品おみやげ購入', en: 'Purchase Karuizawa specialty souvenirs' },
          { zh: '专车送往车站返程', ja: '専用車で駅へお送り、帰路へ', en: 'Private transfer to station for departure' },
        ],
        meals: {
          morning: { zh: '别墅告别早餐', ja: 'ヴィラフェアウェルブレックファスト', en: 'Villa farewell breakfast' },
          lunch: { zh: '会所告别午宴', ja: 'クラブハウスフェアウェルランチ', en: 'Clubhouse farewell luncheon' },
          dinner: { zh: '不含', ja: '不含', en: 'Not included' },
        },
      },
    ],
    budget: {
      items: [
        {
          category: { zh: '奢华下榻', ja: '贅沢宿泊', en: 'Luxury Accommodation' },
          amount: '¥25,000',
          note: { zh: 'Terrace Villa Foresta Asama 6晚独立别墅住宿（双人分享），含私人管家服务', ja: 'Terrace Villa Foresta Asama 6泊独立ヴィラ（2名様）、専属バトラー込み', en: '6 nights at Terrace Villa Foresta Asama private villa (shared double), including butler service' },
        },
        {
          category: { zh: '顶级果岭费', ja: 'トップグリーンフィー', en: 'Top Green Fees' },
          amount: '¥15,000',
          note: { zh: '包含5场顶级球场的果岭费、球车费及部分高端私人球场的特别预约费用', ja: '5ラウンド分のグリーンフィー、カートフィー、一部高級プライベートコースの特別予約料含む', en: 'Includes 5 rounds of green fees, cart fees, and special reservation fees for private courses' },
        },
        {
          category: { zh: '饕餮餐饮', ja: 'グルメ飲食', en: 'Gourmet Dining' },
          amount: '¥12,000',
          note: { zh: '每日别墅内高端早餐、球场精致午餐、以及包含米其林/怀石料理在内的尊享晚宴', ja: '毎日のヴィラ高級朝食、コース上品ランチ、ミシュラン/懐石料理を含む晩餐', en: 'Daily villa premium breakfast, course lunch, and exclusive dinners including Michelin/kaiseki' },
        },
        {
          category: { zh: '专车与服务', ja: '専用車とサービス', en: 'Private Transfer & Services' },
          amount: '¥8,000',
          note: { zh: '全行程私人Alphard商务车接送、专业高尔夫领队服务及所有景点门票、温泉费用', ja: '全行程プライベートAlphard送迎、プロゴルフガイドサービス、全観光地入場料、温泉代含む', en: 'Full itinerary private Alphard transfer, professional golf guide, all entrance fees and onsen' },
        },
      ],
    },
  },
};

// Add more plans with simpler structure
const simplePlanIds = ['nature', 'luxury', 'culture', 'gourmet', 'seasonal'];
simplePlanIds.forEach((id) => {
  planData[id] = {
    id,
    image: `/images/plans/${id}.jpg`,
    title: {
      nature: { zh: '轻井泽自然探索', ja: '軽井沢ネイチャーツアー', en: 'Karuizawa Nature Tour' },
      luxury: { zh: '奢华蜜月之旅', ja: 'ラグジュアリーハネムーン', en: 'Luxury Honeymoon' },
      culture: { zh: '文化艺术之旅', ja: '文化芸術の旅', en: 'Culture & Art Tour' },
      gourmet: { zh: '美食家的轻井泽', ja: 'グルメの軽井沢', en: 'Gourmet Karuizawa' },
      seasonal: { zh: '四季轻井泽', ja: '四季の軽井沢', en: 'Four Seasons Karuizawa' },
    }[id] as { zh: string; ja: string; en: string },
    tagline: {
      zh: '精心策划的非凡旅程',
      ja: '精巧に設計された非凡な旅程',
      en: 'A carefully crafted extraordinary journey',
    },
    description: {
      zh: '我们为您精心策划每一个细节，确保您的轻井泽之旅留下难忘的美好回忆。',
      ja: 'すべての細部を丁寧に設計し、軽井沢の旅に忘れられない美しい思い出を残していただけます。',
      en: 'We carefully plan every detail to ensure your Karuizawa journey leaves unforgettable beautiful memories.',
    },
    duration: { nature: 4, luxury: 5, culture: 3, gourmet: 4, seasonal: 6 }[id] as number,
    price: { nature: '¥35,000', luxury: '¥45,000', culture: '¥25,000', gourmet: '¥40,000', seasonal: '¥50,000' }[id] as string,
    includes: [
      { zh: '独立别墅住宿', ja: '独立ヴィラ宿泊', en: 'Private villa accommodation' },
      { zh: '专属私人管家', ja: '専属プライベートバトラー', en: 'Dedicated private butler' },
      { zh: '每日精致早餐', ja: '毎日上品な朝食', en: 'Daily refined breakfast' },
    ],
    itinerary: Array.from(
      { length: { nature: 4, luxury: 5, culture: 3, gourmet: 4, seasonal: 6 }[id] as number },
      (_, i) => ({
        title: { zh: `第 ${i + 1} 天`, ja: `第 ${i + 1} 日`, en: `Day ${i + 1}` },
        activities: [
          { zh: '根据季节安排精彩活动', ja: '季節に応じた素晴らしいアクティビティ', en: 'Activities arranged according to the season' },
        ],
        meals: {
          morning: { zh: '别墅精致早餐', ja: 'ヴィラ上品な朝食', en: 'Villa refined breakfast' },
          lunch: { zh: '当地特色午餐', ja: '地元特色ランチ', en: 'Local specialty lunch' },
          dinner: { zh: '指定高端餐厅晚宴', ja: '指定高級レストランディナー', en: 'Designated premium restaurant dinner' },
        },
      })
    ),
    budget: {
      items: [
        {
          category: { zh: '住宿', ja: '宿泊', en: 'Accommodation' },
          amount: '60%',
          note: { zh: '独立别墅住宿', ja: '独立ヴィラ宿泊', en: 'Private villa accommodation' },
        },
        {
          category: { zh: '餐饮', ja: '飲食', en: 'Dining' },
          amount: '25%',
          note: { zh: '精致餐饮体验', ja: '上品グルメ体験', en: 'Refined dining experience' },
        },
        {
          category: { zh: '活动', ja: 'アクティビティ', en: 'Activities' },
          amount: '15%',
          note: { zh: '各类精彩活动', ja: '各種素晴らしいアクティビティ', en: 'Various wonderful activities' },
        },
      ],
    },
  };
});

interface PlanMeta {
  titleZh: string; titleJa: string; titleEn: string;
  descZh: string;  descJa: string;  descEn: string;
  duration: number; price: string;
  tagZh: string; tagJa: string; tagEn: string;
  highlightsZh: string[]; highlightsJa: string[]; highlightsEn: string[];
  coverImage: string; visible: boolean;
}

export default function PlanDetailPage() {
  const params = useParams();
  const { t, language } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [spotPhotos, setSpotPhotos] = useState<MediaItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null);

  const planId = params.id as string;
  const plan = planData[planId];

  if (!plan) {
    notFound();
  }

  const lang = language as Lang;

  useEffect(() => {
    const load = async () => {
      try {
        const [layoutRes, allImgRes] = await Promise.all([
          fetch('/api/layouts'),
          fetch('/api/media/images'),
        ]);
        const layout: Record<string, string[]> = layoutRes.ok ? await layoutRes.json() : {};
        const allImgs: MediaItem[] = allImgRes.ok ? await allImgRes.json() : [];
        const galleryUrls = layout[`plan.${plan.id}.gallery`] ?? [];
        const photos = galleryUrls
          .map((url) => allImgs.find((img) => img.url === url))
          .filter(Boolean) as MediaItem[];
        setSpotPhotos(photos);
      } catch { /* silently fail */ }
    };
    load();
  }, [plan.id]);

  useEffect(() => {
    fetch(`/api/plans/${plan.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: PlanMeta | null) => setPlanMeta(data))
      .catch(() => {});
  }, [plan.id]);

  // Use API metadata when available, fall back to hardcoded planData
  const title = planMeta
    ? (lang === 'zh' ? planMeta.titleZh : lang === 'ja' ? planMeta.titleJa : planMeta.titleEn)
    : plan.title[lang];
  const description = planMeta
    ? (lang === 'zh' ? planMeta.descZh : lang === 'ja' ? planMeta.descJa : planMeta.descEn)
    : plan.description[lang];
  const price    = planMeta?.price    ?? plan.price;
  const duration = planMeta?.duration ?? plan.duration;
  const includes = plan.includes; // always from hardcoded data
  const heroImage = (planMeta?.coverImage) || plan.image;

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        {!imageError ? (
          <Image
            src={heroImage}
            alt={title}
            fill
            unoptimized
            className="object-cover brightness-40 animate-kenburns"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark to-dark-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-dark" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="gold-line"></div>
            <span className="text-gold text-[10px] tracking-[0.6em] font-display uppercase">
              {duration} {t(translations.plans.days)}
            </span>
            <div className="gold-line"></div>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 uppercase">
            {title}
          </h1>
          <div className="gold-divider w-48 mb-6" />
          <p className="font-kaiti italic text-gold-light text-lg max-w-2xl">
            {plan.tagline[lang]}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {/* Description */}
        <section className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="gold-line"></div>
                <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Overview</span>
              </div>
              <p className="font-kaiti italic text-white/70 text-lg leading-relaxed mb-8">
                {description}
              </p>
            </div>

            {/* Price Card */}
            <div className="luxury-card p-8 h-fit">
              <div className="text-gold text-[10px] uppercase tracking-[0.5em] font-display mb-2">
                {t(translations.plans.price_from)}
              </div>
              <div className="font-display text-4xl font-bold text-gold mb-1">
                {price}
              </div>
              <div className="text-white/30 text-xs uppercase tracking-widest font-display mb-6">
                {t(translations.plans.per_person)}
              </div>
              <div className="gold-divider mb-6" />
              <div className="space-y-3 mb-8">
                {includes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="text-gold mt-1">✦</span>
                    <span className="font-kaiti italic">{item[lang]}</span>
                  </div>
                ))}
              </div>
              <button className="luxury-btn w-full text-center">
                Contact Us
              </button>
            </div>
          </div>
        </section>

        {/* Tourist Spot Photos */}
        {spotPhotos.length > 0 && (
          <section className="py-8">
            <div className="flex items-center gap-8 mb-8">
              <h2 className="section-title">Highlights</h2>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {spotPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="break-inside-avoid mb-3 relative group cursor-pointer overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-500"
                  onClick={() => { setLightboxIdx(idx); setLightboxOpen(true); }}
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
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
            {/* Lightbox */}
            {lightboxOpen && (
              <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
                <div className="relative w-full max-w-5xl mx-auto px-8 sm:px-16" onClick={(e) => e.stopPropagation()}>
                  <Image
                    src={spotPhotos[lightboxIdx].url}
                    alt={spotPhotos[lightboxIdx].name}
                    width={1200}
                    height={800}
                    unoptimized
                    className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                  />
                  <button onClick={() => setLightboxIdx((p) => (p - 1 + spotPhotos.length) % spotPhotos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all text-white/60 text-xl">‹</button>
                  <button onClick={() => setLightboxIdx((p) => (p + 1) % spotPhotos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all text-white/60 text-xl">›</button>
                  <button onClick={() => setLightboxOpen(false)}
                    className="absolute -top-8 right-8 sm:right-16 text-white/40 hover:text-gold text-3xl">×</button>
                  <div className="flex justify-between mt-3">
                    <span className="font-kaiti italic text-white/30 text-sm">{spotPhotos[lightboxIdx].name}</span>
                    <span className="font-display text-white/30 text-[10px] tracking-widest">{lightboxIdx + 1} / {spotPhotos.length}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Itinerary */}
        <section className="py-8">
          <div className="flex items-center gap-8 mb-10">
            <h2 className="section-title">{t(translations.plans.itinerary)}</h2>
            <div className="h-[1px] flex-1 bg-gold/20" />
          </div>

          <div className="space-y-6">
            {plan.itinerary.map((day, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-b border-white/5 pb-6 last:border-0"
              >
                <div className="hidden sm:block w-12 flex-shrink-0 font-display text-3xl font-bold text-gold/20 text-right">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-serif font-bold text-white text-lg mb-3">
                      {day.title[lang]}
                    </h3>
                    <div className="bg-white/5 p-4 rounded-sm">
                      <ul className="space-y-2">
                        {day.activities.map((act, aIdx) => (
                          <li
                            key={aIdx}
                            className="flex items-start gap-2 text-sm text-white/60 font-kaiti italic"
                          >
                            <span className="text-gold mt-0.5">✦</span>
                            {act[lang]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-gold/5 p-4 rounded-sm border border-gold/10">
                    {[
                      { key: 'morning', label: t(translations.plans.meal_morning), val: day.meals.morning },
                      { key: 'lunch', label: t(translations.plans.meal_lunch), val: day.meals.lunch },
                      { key: 'dinner', label: t(translations.plans.meal_dinner), val: day.meals.dinner },
                    ].map(({ key, label, val }) => (
                      <div
                        key={key}
                        className="flex justify-between border-b border-white/5 last:border-0 py-2 text-sm"
                      >
                        <span className="text-white/30 uppercase tracking-widest font-display text-[10px]">
                          {label}
                        </span>
                        <span className="text-white/70 font-kaiti italic">{val[lang]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Budget Overview */}
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
                    {language === 'zh' ? '项目' : language === 'ja' ? '項目' : 'Item'}
                  </th>
                  <th className="p-3 border border-white/10 font-display text-gold text-[10px] uppercase tracking-widest">
                    {language === 'zh' ? '金额' : language === 'ja' ? '金額' : 'Amount'}
                  </th>
                  <th className="p-3 border border-white/10 font-display text-gold text-[10px] uppercase tracking-widest">
                    {language === 'zh' ? '说明' : language === 'ja' ? '説明' : 'Description'}
                  </th>
                </tr>
              </thead>
              <tbody className="text-white/60 font-kaiti italic">
                {plan.budget.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="p-3 border border-white/10 font-bold text-white not-italic font-sans">
                      {item.category[lang]}
                    </td>
                    <td className="p-3 border border-white/10 text-gold font-display font-bold not-italic">
                      {item.amount}
                    </td>
                    <td className="p-3 border border-white/10">{item.note[lang]}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gold/10">
                  <td className="p-3 border border-white/10 font-display text-gold font-bold text-sm uppercase tracking-wider">
                    Total
                  </td>
                  <td className="p-3 border border-white/10 font-display text-gold font-bold text-lg">
                    {plan.price}
                  </td>
                  <td className="p-3 border border-white/10 text-white/30 text-[11px] font-display not-italic">
                    {t(translations.plans.per_person)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Back to Plans */}
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
