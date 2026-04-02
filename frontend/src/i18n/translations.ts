export type Language = 'zh' | 'ja' | 'en';

export const translations = {
  // Navigation
  nav: {
    home: { zh: '首页', ja: 'ホーム', en: 'Home' },
    library: { zh: '图片库', ja: 'フォトギャラリー', en: 'Gallery' },
    plans: { zh: '旅行方案', ja: '旅行プラン', en: 'Travel Plans' },
    surroundings: { zh: '周边介绍', ja: '周辺案内', en: 'Surroundings' },
    admin: { zh: '管理', ja: '管理', en: 'Admin' },
  },

  // Top page
  top: {
    tagline: {
      zh: '避暑胜地的极致奢享，森林深处的隐逸天堂',
      ja: '避暑地の極上の贅沢、森の奥に佇む隠れ家',
      en: 'Ultimate Luxury in a Mountain Retreat, a Hidden Paradise Deep in the Forest',
    },
    subtitle: {
      zh: '在日本最具代表性的度假胜地轻井泽，开启极致奢华的假日时光。',
      ja: '日本を代表するリゾート地、軽井沢で極上の休暇をお過ごしください。',
      en: 'Begin your journey of ultimate luxury in Karuizawa, Japan\'s most prestigious resort destination.',
    },
    intro_title: { zh: 'About the Villa', ja: 'ヴィラについて', en: 'About the Villa' },
    intro_text: {
      zh: '下榻于此，您将体验到绝佳的私密性与尊贵感。这些独立别墅不仅提供了极致宽敞的居住空间，更配备了俯瞰浅间山的私人景观露台。这并非仅仅是一家酒店，更是一处深植于自然中的"归家之所"。',
      ja: 'ここに滞在することで、最高のプライバシーと高貴な体験をお楽しみいただけます。独立したヴィラは極めて広々とした居住空間を提供し、浅間山を一望できるプライベートテラスを備えています。',
      en: 'Staying here, you will experience unparalleled privacy and prestige. These independent villas offer extremely spacious living spaces and private terraces overlooking Mt. Asama.',
    },
    features: {
      private: {
        title: { zh: '极致私密', ja: '完全プライベート', en: 'Ultimate Privacy' },
        desc: { zh: '独立别墅，完全私密的奢华体验', ja: '独立ヴィラで完全なプライベート空間', en: 'Independent villa with complete privacy' },
      },
      nature: {
        title: { zh: '森林环抱', ja: '森に抱かれた', en: 'Forest Embrace' },
        desc: { zh: '坐落于轻井泽原始森林之中', ja: '軽井沢の原生林に囲まれた立地', en: 'Nestled in Karuizawa\'s primeval forest' },
      },
      asama: {
        title: { zh: '浅间山景', ja: '浅間山の眺望', en: 'Mt. Asama View' },
        desc: { zh: '私人露台直面雄伟浅间山', ja: 'プライベートテラスから浅間山を一望', en: 'Private terrace facing magnificent Mt. Asama' },
      },
      service: {
        title: { zh: '管家服务', ja: 'バトラーサービス', en: 'Butler Service' },
        desc: { zh: '全程专属私人管家贴心服务', ja: '専属バトラーによる手厚いサービス', en: 'Dedicated personal butler throughout your stay' },
      },
    },
    video_title: { zh: 'Villa Video', ja: 'ヴィラ動画', en: 'Villa Video' },
    explore_btn: { zh: '探索别墅', ja: 'ヴィラを探索', en: 'Explore the Villa' },
  },

  // Library page
  library: {
    title: { zh: 'Photo Gallery', ja: 'Photo Gallery', en: 'Photo Gallery' },
    subtitle: {
      zh: '探索别墅的每一个精心设计的角落',
      ja: 'ヴィラの丁寧に設計された各コーナーを探索してください',
      en: 'Explore every meticulously designed corner of the villa',
    },
    categories: {
      all: { zh: '全部', ja: 'すべて', en: 'All' },
      exterior: { zh: '外观', ja: '外観', en: 'Exterior' },
      interior: { zh: '室内', ja: '室内', en: 'Interior' },
      terrace: { zh: '露台', ja: 'テラス', en: 'Terrace' },
      dining: { zh: '餐饮', ja: 'ダイニング', en: 'Dining' },
      nature: { zh: '自然', ja: '自然', en: 'Nature' },
    },
  },

  // Plans page
  plans: {
    title: { zh: 'Travel Plans', ja: 'Travel Plans', en: 'Travel Plans' },
    subtitle: {
      zh: '为追求生活品质的精英量身定制',
      ja: '生活の質を追求するエリートのために特別に設計',
      en: 'Tailor-made for those who seek the finest in life',
    },
    days: { zh: '天', ja: '日間', en: 'Days' },
    price_from: { zh: '起', ja: 'から', en: 'from' },
    view_details: { zh: '查看详情', ja: '詳細を見る', en: 'View Details' },
    includes: { zh: '方案包含', ja: 'プランに含む', en: 'Includes' },
    highlights: { zh: '特色亮点', ja: 'ハイライト', en: 'Highlights' },
    itinerary: { zh: '行程详情', ja: '旅程詳細', en: 'Itinerary' },
    day: { zh: '第', ja: '第', en: 'Day ' },
    meal_morning: { zh: '早餐', ja: '朝食', en: 'Breakfast' },
    meal_lunch: { zh: '午餐', ja: '昼食', en: 'Lunch' },
    meal_dinner: { zh: '晚餐', ja: '夕食', en: 'Dinner' },
    budget_overview: { zh: '费用概览', ja: '費用概要', en: 'Budget Overview' },
    per_person: { zh: '每人', ja: '一人あたり', en: 'Per Person' },
  },

  // Surroundings page
  surroundings: {
    title: { zh: 'Surroundings', ja: 'Surroundings', en: 'Surroundings' },
    subtitle: {
      zh: '探索轻井泽的无限魅力',
      ja: '軽井沢の無限の魅力を探索',
      en: 'Explore the Endless Charms of Karuizawa',
    },
    karuizawa_intro: {
      zh: '轻井泽作为日本最负盛名的名流别墅区，自明治时代起便是皇室与政商名流的夏季避暑胜地。这里不仅拥有得天独厚的清凉气候，更是身份与品位的象征。',
      ja: '軽井沢は日本で最も有名な名士の別荘地として、明治時代から皇室や政財界の名士の夏の避暑地として愛されてきました。',
      en: 'As Japan\'s most prestigious villa resort, Karuizawa has been the summer retreat for royalty and elite society since the Meiji era.',
    },
    categories: {
      nature: { zh: '自然景观', ja: '自然景観', en: 'Nature' },
      culture: { zh: '文化艺术', ja: '文化・芸術', en: 'Culture & Art' },
      gourmet: { zh: '美食', ja: 'グルメ', en: 'Gourmet' },
      shopping: { zh: '购物', ja: 'ショッピング', en: 'Shopping' },
      activity: { zh: '活动体验', ja: 'アクティビティ', en: 'Activities' },
    },
    distance: { zh: '距别墅', ja: 'ヴィラから', en: 'From Villa' },
    minutes: { zh: '分钟', ja: '分', en: 'min' },
  },

  // Admin page
  admin: {
    title: { zh: 'Media Management', ja: 'Media Management', en: 'Media Management' },
    subtitle: {
      zh: '管理别墅的图片和视频资源',
      ja: 'ヴィラの画像・動画素材を管理',
      en: 'Manage villa image and video assets',
    },
    upload_image: { zh: '上传图片', ja: '画像をアップロード', en: 'Upload Image' },
    upload_video: { zh: '上传视频', ja: '動画をアップロード', en: 'Upload Video' },
    category: { zh: '分类', ja: 'カテゴリ', en: 'Category' },
    file_name: { zh: '文件名', ja: 'ファイル名', en: 'File Name' },
    size: { zh: '大小', ja: 'サイズ', en: 'Size' },
    upload_date: { zh: '上传日期', ja: 'アップロード日', en: 'Upload Date' },
    actions: { zh: '操作', ja: 'アクション', en: 'Actions' },
    delete: { zh: '删除', ja: '削除', en: 'Delete' },
    set_hero: { zh: '设为主图', ja: 'メイン画像に設定', en: 'Set as Hero' },
    images_tab: { zh: '图片管理', ja: '画像管理', en: 'Images' },
    videos_tab: { zh: '视频管理', ja: '動画管理', en: 'Videos' },
    drag_drop: { zh: '拖拽文件到此处或点击上传', ja: 'ファイルをここにドラッグするかクリックしてアップロード', en: 'Drag files here or click to upload' },
    uploading: { zh: '上传中...', ja: 'アップロード中...', en: 'Uploading...' },
    upload_success: { zh: '上传成功', ja: 'アップロード成功', en: 'Upload successful' },
    confirm_delete: { zh: '确认删除？', ja: '削除してもよろしいですか？', en: 'Confirm deletion?' },
  },

  // Common
  common: {
    loading: { zh: '加载中...', ja: '読み込み中...', en: 'Loading...' },
    error: { zh: '出错了', ja: 'エラーが発生しました', en: 'An error occurred' },
    back: { zh: '返回', ja: '戻る', en: 'Back' },
    close: { zh: '关闭', ja: '閉じる', en: 'Close' },
    next: { zh: '下一个', ja: '次へ', en: 'Next' },
    prev: { zh: '上一个', ja: '前へ', en: 'Previous' },
    view_all: { zh: '查看全部', ja: 'すべて見る', en: 'View All' },
    contact: { zh: '联系我们', ja: 'お問い合わせ', en: 'Contact Us' },
  },

  // Footer
  footer: {
    address: {
      zh: '〒389-0111 长野县北佐久郡轻井泽町',
      ja: '〒389-0111 長野県北佐久郡軽井沢町',
      en: '〒389-0111 Karuizawa-machi, Kitasaku-gun, Nagano',
    },
    rights: { zh: '版权所有', ja: '著作権所有', en: 'All Rights Reserved' },
    privacy: { zh: '隐私政策', ja: 'プライバシーポリシー', en: 'Privacy Policy' },
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(
  obj: { zh: string; ja: string; en: string },
  lang: Language
): string {
  return obj[lang];
}
