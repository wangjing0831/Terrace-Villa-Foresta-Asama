import mysql from 'mysql2/promise';

let prodPool: mysql.Pool | undefined;
let testPool: mysql.Pool | undefined;

function createPool(database: string): mysql.Pool {
  return mysql.createPool({
    host:                  process.env.DB_HOST     || 'localhost',
    port:                  Number(process.env.DB_PORT || 3306),
    user:                  process.env.DB_USER     || 'root',
    password:              process.env.DB_PASS     || '',
    database,
    waitForConnections:    true,
    connectionLimit:       5,
    charset:               'utf8mb4',
    connectTimeout:        5000,
    enableKeepAlive:       true,
    keepAliveInitialDelay: 10000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
}

/** x-test-mode ヘッダーが付いているリクエストかどうか判定 */
export function isTestReq(req: Request): boolean {
  return req.headers.get('x-test-mode') === 'true';
}

/** isTest=true のとき foresta_asama_test スキーマを使用 */
export function getDb(isTest = false): mysql.Pool {
  if (isTest) {
    testPool ??= createPool('foresta_asama_test');
    return testPool;
  }
  prodPool ??= createPool(process.env.DB_NAME || 'foresta_asama');
  return prodPool;
}

export async function runMigration(): Promise<void> {
  const db = getDb();
  const tables = [
    `CREATE TABLE IF NOT EXISTS media (
      id          VARCHAR(36)   PRIMARY KEY,
      name        VARCHAR(255)  NOT NULL DEFAULT '',
      url         VARCHAR(1024) NOT NULL DEFAULT '',
      s3_key      VARCHAR(1024),
      type        VARCHAR(50)   DEFAULT 'image',
      category    VARCHAR(100)  DEFAULT '',
      size        BIGINT        DEFAULT 0,
      upload_date DATETIME      DEFAULT CURRENT_TIMESTAMP,
      is_hero     TINYINT(1)    DEFAULT 0,
      sort_order  INT           DEFAULT 0,
      created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS page_layouts (
      section_key VARCHAR(200) PRIMARY KEY,
      image_urls  JSON         NOT NULL,
      updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS plans (
      id              VARCHAR(100) PRIMARY KEY,
      title_zh        VARCHAR(500) DEFAULT '',
      title_ja        VARCHAR(500) DEFAULT '',
      title_en        VARCHAR(500) DEFAULT '',
      desc_zh         TEXT,
      desc_ja         TEXT,
      desc_en         TEXT,
      duration        INT          DEFAULT 1,
      price           VARCHAR(100) DEFAULT '',
      tag_zh          VARCHAR(500) DEFAULT '',
      tag_ja          VARCHAR(500) DEFAULT '',
      tag_en          VARCHAR(500) DEFAULT '',
      highlights_zh   JSON,
      highlights_ja   JSON,
      highlights_en   JSON,
      cover_image     VARCHAR(1024) DEFAULT '',
      visible         TINYINT(1)   DEFAULT 1,
      sort_order      INT          DEFAULT 0,
      created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      username      VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(50)  DEFAULT 'admin',
      created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS plan_highlights (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      plan_id         VARCHAR(100) NOT NULL,
      sort_order      INT          DEFAULT 0,
      title_zh        VARCHAR(500) DEFAULT '',
      title_ja        VARCHAR(500) DEFAULT '',
      title_en        VARCHAR(500) DEFAULT '',
      description_zh  TEXT,
      description_ja  TEXT,
      description_en  TEXT,
      image_url       VARCHAR(1024) DEFAULT '',
      created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_plan_id (plan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS plan_days (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      plan_id           VARCHAR(100) NOT NULL,
      day_number        INT          NOT NULL,
      title_zh          VARCHAR(500) DEFAULT '',
      title_ja          VARCHAR(500) DEFAULT '',
      title_en          VARCHAR(500) DEFAULT '',
      activities_zh     JSON,
      activities_ja     JSON,
      activities_en     JSON,
      meal_morning_zh   VARCHAR(500) DEFAULT '',
      meal_morning_ja   VARCHAR(500) DEFAULT '',
      meal_morning_en   VARCHAR(500) DEFAULT '',
      meal_lunch_zh     VARCHAR(500) DEFAULT '',
      meal_lunch_ja     VARCHAR(500) DEFAULT '',
      meal_lunch_en     VARCHAR(500) DEFAULT '',
      meal_dinner_zh    VARCHAR(500) DEFAULT '',
      meal_dinner_ja    VARCHAR(500) DEFAULT '',
      meal_dinner_en    VARCHAR(500) DEFAULT '',
      INDEX idx_plan_id (plan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS plan_budget_items (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      plan_id      VARCHAR(100) NOT NULL,
      sort_order   INT          DEFAULT 0,
      category_zh  VARCHAR(200) DEFAULT '',
      category_ja  VARCHAR(200) DEFAULT '',
      category_en  VARCHAR(200) DEFAULT '',
      amount       VARCHAR(100) DEFAULT '',
      note_zh      TEXT,
      note_ja      TEXT,
      note_en      TEXT,
      INDEX idx_plan_id (plan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS contact_info (
      id              INT          PRIMARY KEY DEFAULT 1,
      phone           VARCHAR(100) DEFAULT '',
      phone_visible   TINYINT(1)   DEFAULT 1,
      email           VARCHAR(255) DEFAULT '',
      email_visible   TINYINT(1)   DEFAULT 1,
      line_id         VARCHAR(100) DEFAULT '',
      line_qr_url     VARCHAR(1024) DEFAULT '',
      line_visible    TINYINT(1)   DEFAULT 1,
      wechat_id       VARCHAR(100) DEFAULT '',
      wechat_qr_url   VARCHAR(1024) DEFAULT '',
      wechat_visible  TINYINT(1)   DEFAULT 1,
      updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS surroundings_spots (
      id              VARCHAR(100)  PRIMARY KEY,
      category        VARCHAR(50)   DEFAULT 'nature',
      name_zh         VARCHAR(500)  DEFAULT '',
      name_ja         VARCHAR(500)  DEFAULT '',
      name_en         VARCHAR(500)  DEFAULT '',
      description_zh  TEXT,
      description_ja  TEXT,
      description_en  TEXT,
      distance        INT           DEFAULT 0,
      image_url       VARCHAR(1024) DEFAULT '',
      tags_zh         JSON,
      tags_ja         JSON,
      tags_en         JSON,
      visible         TINYINT(1)   DEFAULT 1,
      sort_order      INT           DEFAULT 0,
      created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of tables) {
    await db.query(sql);
  }

  // Extend plan_budget_items with per-language amount/currency columns
  const budgetCols: [string, string][] = [
    ['amount_zh',   "VARCHAR(100) DEFAULT ''"],
    ['currency_zh', "VARCHAR(10)  DEFAULT 'CNY'"],
    ['amount_ja',   "VARCHAR(100) DEFAULT ''"],
    ['currency_ja', "VARCHAR(10)  DEFAULT 'JPY'"],
    ['amount_en',   "VARCHAR(100) DEFAULT ''"],
    ['currency_en', "VARCHAR(10)  DEFAULT 'USD'"],
  ];
  const dbName = process.env.DB_NAME || 'foresta_asama';
  for (const [col, colType] of budgetCols) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'plan_budget_items' AND COLUMN_NAME = ?`,
      [dbName, col],
    ) as any[][];
    if (rows[0].cnt === 0) {
      await db.query(`ALTER TABLE plan_budget_items ADD COLUMN ${col} ${colType}`);
    }
  }

  // Migrate old `amount` column data → new per-language columns (one-time, idempotent)
  await db.query(`
    UPDATE plan_budget_items
    SET amount_zh = amount, amount_ja = amount, amount_en = amount
    WHERE amount IS NOT NULL AND amount != ''
      AND (amount_zh IS NULL OR amount_zh = '')
  `).catch(() => {});

  // Extend plans table with new columns — MySQL 5.7 compatible (no ADD COLUMN IF NOT EXISTS)
  const newColumns: [string, string][] = [
    ['prestige_zh',           'TEXT'],
    ['prestige_ja',           'TEXT'],
    ['prestige_en',           'TEXT'],
    ['accommodation_images',  'JSON'],
    ['conclusion_zh',         'TEXT'],
    ['conclusion_ja',         'TEXT'],
    ['conclusion_en',         'TEXT'],
  ];

  for (const [col, colType] of newColumns) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'plans' AND COLUMN_NAME = ?`,
      [dbName, col],
    ) as any[][];
    if (rows[0].cnt === 0) {
      await db.query(`ALTER TABLE plans ADD COLUMN ${col} ${colType}`);
    }
  }

  // One-time: rewrite old direct S3 URLs → CloudFront URLs in all tables
  const cdn = process.env.CDN_DOMAIN || 'd143jkdkye8i79.cloudfront.net';
  const cdnBase = `https://${cdn}`;
  const s3Like = '%amazonaws.com%';

  // Simple VARCHAR columns
  for (const [tbl, col] of [
    ['media',              'url'],
    ['surroundings_spots', 'image_url'],
    ['plan_highlights',    'image_url'],
    ['contact_info',       'line_qr_url'],
    ['contact_info',       'wechat_qr_url'],
    ['plans',              'cover_image'],
  ] as [string, string][]) {
    await db.query(
      `UPDATE ${tbl} SET ${col} = CONCAT(?, '/', SUBSTRING_INDEX(${col}, 'amazonaws.com/', -1)) WHERE ${col} LIKE ?`,
      [cdnBase, s3Like],
    ).catch(() => {});
  }

  // JSON array columns: page_layouts.image_urls and plans.accommodation_images
  const [layouts] = await db.query('SELECT section_key, image_urls FROM page_layouts').catch(() => [[]] as any) as any[][];
  for (const row of layouts as any[]) {
    const urls: string[] = typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : (row.image_urls ?? []);
    const fixed = urls.map((u: string) => u.includes('amazonaws.com') ? `${cdnBase}/${u.split('amazonaws.com/').pop()}` : u);
    if (fixed.some((u, i) => u !== urls[i])) {
      await db.query('UPDATE page_layouts SET image_urls = ? WHERE section_key = ?', [JSON.stringify(fixed), row.section_key]).catch(() => {});
    }
  }
  const [plans] = await db.query('SELECT id, accommodation_images FROM plans WHERE accommodation_images IS NOT NULL').catch(() => [[]] as any) as any[][];
  for (const row of plans as any[]) {
    if (!row.accommodation_images) continue;
    const imgs: string[] = typeof row.accommodation_images === 'string' ? JSON.parse(row.accommodation_images) : row.accommodation_images;
    const fixed = imgs.map((u: string) => u.includes('amazonaws.com') ? `${cdnBase}/${u.split('amazonaws.com/').pop()}` : u);
    if (fixed.some((u, i) => u !== imgs[i])) {
      await db.query('UPDATE plans SET accommodation_images = ? WHERE id = ?', [JSON.stringify(fixed), row.id]).catch(() => {});
    }
  }

  console.log('[db] migration complete');
}

// ─── Seasons tables — created per-request with the correct DB (prod or test) ──

const SEASONS_DDL = [
  `CREATE TABLE IF NOT EXISTS seasons (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    season        ENUM('spring','summer','autumn','winter') NOT NULL,
    name_zh       VARCHAR(200) NOT NULL DEFAULT '',
    name_ja       VARCHAR(200) NOT NULL DEFAULT '',
    name_en       VARCHAR(200) NOT NULL DEFAULT '',
    desc_zh       TEXT,
    desc_ja       TEXT,
    desc_en       TEXT,
    access_zh     VARCHAR(300) DEFAULT '',
    access_ja     VARCHAR(300) DEFAULT '',
    access_en     VARCHAR(300) DEFAULT '',
    distance_min  INT          DEFAULT 0,
    is_featured   TINYINT(1)   DEFAULT 0,
    display_order INT          DEFAULT 0,
    is_active     TINYINT(1)   DEFAULT 1,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS season_images (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    season_id     INT          NOT NULL,
    image_url     VARCHAR(500) NOT NULL DEFAULT '',
    s3_key        VARCHAR(500) DEFAULT '',
    alt_zh        VARCHAR(200) DEFAULT '',
    alt_ja        VARCHAR(200) DEFAULT '',
    alt_en        VARCHAR(200) DEFAULT '',
    is_main       TINYINT(1)   DEFAULT 0,
    display_order INT          DEFAULT 0,
    INDEX idx_season_id (season_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

export async function ensureSeasonsTables(isTest = false): Promise<void> {
  const db = getDb(isTest);
  for (const sql of SEASONS_DDL) {
    await db.query(sql);
  }
}

// ─── Season initial data — seeded once per DB when table is empty ─────────────

type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeedSpot {
  season: SeasonKey;
  nameZh: string; nameJa: string; nameEn: string;
  descZh: string; descJa: string; descEn: string;
  accessZh: string; accessJa: string; accessEn: string;
  distanceMin: number;
  isFeatured: boolean;
  displayOrder: number;
}

const DEFAULT_SEASONS: SeedSpot[] = [
  // ── 春 Spring ──────────────────────────────────────────────────────────────
  {
    season: 'spring', isFeatured: true, displayOrder: 0, distanceMin: 15,
    nameZh: '轻井泽王子购物广场', nameJa: '軽井沢・プリンスショッピングプラザ', nameEn: 'Karuizawa Prince Shopping Plaza',
    descZh: '日本最大规模的奥特莱斯之一，汇聚了超过220家品牌店铺，包括Gucci、Prada等顶级奢侈品牌。支持免税及微信支付，别墅距此约15分钟车程。',
    descJa: '国内最大級のアウトレットモール。グッチ・プラダ等の高級ブランドを含む220店舗以上が集結。免税・WeChat Pay対応。別荘から車で約15分。',
    descEn: "One of Japan's largest outlet malls with over 220 stores including Gucci and Prada. Tax-free shopping and WeChat Pay available. About 15 minutes from the villa.",
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
  {
    season: 'spring', isFeatured: true, displayOrder: 1, distanceMin: 10,
    nameZh: '星野温泉 蜻蜓之汤', nameJa: '星野温泉 トンボの湯', nameEn: 'Hoshinoya Onsen Tombo-no-yu',
    descZh: '轻井泽代表性的温泉设施。弱碱性泉质，被称为「美肌之汤」，深受女性旅客喜爱。距别墅仅约10分钟。',
    descJa: '軽井沢を代表する温泉施設。弱アルカリ性の泉質は「美人の湯」として女性に人気。別荘から約10分。',
    descEn: "Karuizawa's premier hot spring facility. The slightly alkaline water is known as a \"beauty spring.\" About 10 minutes from the villa.",
    accessZh: '距别墅约10分钟车程', accessJa: '別荘から車で約10分', accessEn: 'About 10 min by car from the villa',
  },
  {
    season: 'spring', isFeatured: false, displayOrder: 2, distanceMin: 20,
    nameZh: '白丝瀑布', nameJa: '白糸の滝', nameEn: 'Shiraito Falls',
    descZh: '细如白丝般倾泻而下的美丽瀑布，宽约70米，春季水量充沛。被指定为国家名胜及天然纪念物。',
    descJa: '白糸のように繊細に流れる幅約70mの美しい滝。春は水量が豊富で迫力満点。国の名勝・天然記念物に指定。',
    descEn: 'Beautiful waterfall flowing like white silk threads, about 70m wide. A national scenic spot and natural monument. Especially impressive in spring.',
    accessZh: '距别墅约20分钟车程', accessJa: '別荘から車で約20分', accessEn: 'About 20 min by car from the villa',
  },
  {
    season: 'spring', isFeatured: false, displayOrder: 3, distanceMin: 18,
    nameZh: '旧轻井泽银座商店街', nameJa: '旧軽井沢銀座', nameEn: 'Old Karuizawa Ginza',
    descZh: '轻井泽最具历史风情的购物街，两侧林立着珠宝、工艺品、咖啡馆等特色店铺。春天绿意盎然，悠闲漫步最为惬意。',
    descJa: '軽井沢らしい風情漂うショッピングストリート。宝石・工芸品・カフェなど個性豊かな店が並ぶ。春は新緑の中の散策が心地よい。',
    descEn: 'Karuizawa\'s most charming shopping street lined with jewelry, crafts, and cafes. A leisurely spring stroll amid fresh greenery is a must.',
    accessZh: '距别墅约18分钟车程', accessJa: '別荘から車で約18分', accessEn: 'About 18 min by car from the villa',
  },

  // ── 夏 Summer ──────────────────────────────────────────────────────────────
  {
    season: 'summer', isFeatured: true, displayOrder: 0, distanceMin: 15,
    nameZh: '轻井泽王子购物广场', nameJa: '軽井沢・プリンスショッピングプラザ', nameEn: 'Karuizawa Prince Shopping Plaza',
    descZh: '日本最大规模的奥特莱斯之一，汇聚了超过220家品牌店铺，包括Gucci、Prada等顶级奢侈品牌。支持免税及微信支付，别墅距此约15分钟车程。',
    descJa: '国内最大級のアウトレットモール。グッチ・プラダ等の高級ブランドを含む220店舗以上が集結。免税・WeChat Pay対応。別荘から車で約15分。',
    descEn: "One of Japan's largest outlet malls with over 220 stores including Gucci and Prada. Tax-free shopping and WeChat Pay available. About 15 minutes from the villa.",
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
  {
    season: 'summer', isFeatured: true, displayOrder: 1, distanceMin: 10,
    nameZh: '星野温泉 蜻蜓之汤', nameJa: '星野温泉 トンボの湯', nameEn: 'Hoshinoya Onsen Tombo-no-yu',
    descZh: '轻井泽代表性的温泉设施。弱碱性泉质，被称为「美肌之汤」，深受女性旅客喜爱。距别墅仅约10分钟。',
    descJa: '軽井沢を代表する温泉施設。弱アルカリ性の泉質は「美人の湯」として女性に人気。別荘から約10分。',
    descEn: "Karuizawa's premier hot spring facility. The slightly alkaline water is known as a \"beauty spring.\" About 10 minutes from the villa.",
    accessZh: '距别墅约10分钟车程', accessJa: '別荘から車で約10分', accessEn: 'About 10 min by car from the villa',
  },
  {
    season: 'summer', isFeatured: false, displayOrder: 2, distanceMin: 20,
    nameZh: '轻井泽高尔夫球场', nameJa: '軽井沢ゴルフ場', nameEn: 'Karuizawa Golf Course',
    descZh: '海拔约1000米的高原高尔夫球场，夏季气候凉爽宜人。多个球场可供选择，享受被绿意包围的高原高尔夫体验。',
    descJa: '標高約1000mの高原ゴルフ場。夏でも涼しく快適なプレーが楽しめる。複数コースが揃い、緑に囲まれた高原ゴルフを満喫できる。',
    descEn: 'Highland golf course at 1,000m elevation — cool and comfortable even in summer. Multiple courses available amid lush greenery.',
    accessZh: '距别墅约20分钟车程', accessJa: '別荘から車で約20分', accessEn: 'About 20 min by car from the villa',
  },
  {
    season: 'summer', isFeatured: false, displayOrder: 3, distanceMin: 12,
    nameZh: '轻井泽高原教堂', nameJa: '軽井沢高原教会', nameEn: 'Karuizawa Kogen Church',
    descZh: '坐落于白桦林中的浪漫石造教堂，夏季绿荫与教堂白墙相映成趣，是轻井泽极具代表性的风景。',
    descJa: '白樺林に佇むロマンティックな石造りの教会。夏の緑と白い外壁のコントラストが軽井沢らしい絶景を作り出す。',
    descEn: 'A romantic stone church nestled in a birch forest. The contrast of summer greenery against its white walls creates a quintessential Karuizawa scene.',
    accessZh: '距别墅约12分钟车程', accessJa: '別荘から車で約12分', accessEn: 'About 12 min by car from the villa',
  },

  // ── 秋 Autumn ──────────────────────────────────────────────────────────────
  {
    season: 'autumn', isFeatured: true, displayOrder: 0, distanceMin: 15,
    nameZh: '云场池（红叶名所）', nameJa: '雲場池（紅葉）', nameEn: 'Kumoba Pond (Autumn Foliage)',
    descZh: '秋季最值得一游的景点。池面倒映的绚烂红叶被誉为轻井泽最美的风景，每年10月中旬至11月初为最佳观赏期。别墅约15分钟可达。',
    descJa: '秋の必訪スポット。池面に映る燃えるような紅葉は軽井沢随一の絶景。例年10月中旬〜11月上旬が見頃。約15分。',
    descEn: 'The must-visit spot in autumn. The blazing foliage reflected in the pond is Karuizawa\'s most stunning scenery. Best viewed from mid-October to early November.',
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
  {
    season: 'autumn', isFeatured: true, displayOrder: 1, distanceMin: 15,
    nameZh: '轻井泽王子购物广场', nameJa: '軽井沢・プリンスショッピングプラザ', nameEn: 'Karuizawa Prince Shopping Plaza',
    descZh: '日本最大规模的奥特莱斯之一，汇聚了超过220家品牌店铺，包括Gucci、Prada等顶级奢侈品牌。支持免税及微信支付，别墅距此约15分钟车程。',
    descJa: '国内最大級のアウトレットモール。グッチ・プラダ等の高級ブランドを含む220店舗以上が集結。免税・WeChat Pay対応。別荘から車で約15分。',
    descEn: "One of Japan's largest outlet malls with over 220 stores including Gucci and Prada. Tax-free shopping and WeChat Pay available. About 15 minutes from the villa.",
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
  {
    season: 'autumn', isFeatured: true, displayOrder: 2, distanceMin: 10,
    nameZh: '星野温泉 蜻蜓之汤', nameJa: '星野温泉 トンボの湯', nameEn: 'Hoshinoya Onsen Tombo-no-yu',
    descZh: '轻井泽代表性的温泉设施。弱碱性泉质，被称为「美肌之汤」，深受女性旅客喜爱。距别墅仅约10分钟。',
    descJa: '軽井沢を代表する温泉施設。弱アルカリ性の泉質は「美人の湯」として女性に人気。別荘から約10分。',
    descEn: "Karuizawa's premier hot spring facility. The slightly alkaline water is known as a \"beauty spring.\" About 10 minutes from the villa.",
    accessZh: '距别墅约10分钟车程', accessJa: '別荘から車で約10分', accessEn: 'About 10 min by car from the villa',
  },
  {
    season: 'autumn', isFeatured: false, displayOrder: 3, distanceMin: 20,
    nameZh: '轻井泽酒窖', nameJa: '軽井沢ワインセラー', nameEn: 'Karuizawa Wine Cellar',
    descZh: '拥有百余年历史的酿酒厂，秋天正是葡萄收获的季节。可参观酒窖、品尝当地葡萄酒，体验轻井沢独特的酿酒文化。',
    descJa: '百年以上の歴史を持つワイナリー。秋はぶどうの収穫期。セラー見学やテイスティングで軽井沢のワイン文化を体験できる。',
    descEn: 'A winery with over a century of history. Autumn is harvest season — enjoy cellar tours and wine tastings to experience Karuizawa\'s winemaking culture.',
    accessZh: '距别墅约20分钟车程', accessJa: '別荘から車で約20分', accessEn: 'About 20 min by car from the villa',
  },

  // ── 冬 Winter ──────────────────────────────────────────────────────────────
  {
    season: 'winter', isFeatured: true, displayOrder: 0, distanceMin: 15,
    nameZh: '轻井泽王子酒店滑雪场', nameJa: '軽井沢プリンスホテルスキー場', nameEn: 'Karuizawa Prince Hotel Ski Resort',
    descZh: '从东京出发约70分钟即可抵达的便捷滑雪场，初学者专用坡道完善，附设滑雪学校与租赁服务。别墅距此约15分钟车程。',
    descJa: '東京から約70分でアクセスできるスキー場。初心者向けゲレンデが充実し、スクールとレンタルも完備。別荘から約15分。',
    descEn: 'Conveniently located just 70 minutes from Tokyo. Excellent beginner slopes with ski school and full rental equipment. About 15 minutes from the villa.',
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
  {
    season: 'winter', isFeatured: true, displayOrder: 1, distanceMin: 10,
    nameZh: '星野温泉 蜻蜓之汤（雪见露天浴）', nameJa: '星野温泉 トンボの湯（雪見露天）', nameEn: 'Hoshinoya Onsen Tombo-no-yu (Snow View)',
    descZh: '冬季限定的雪见露天温泉体验。一边泡汤，一边欣赏雪景，是轻井泽冬季最奢华的享受。距别墅约10分钟。',
    descJa: '冬季限定の雪見露天を楽しめる。湯に浸かりながら雪景色を眺める体験は軽井沢冬の最高の贅沢。別荘から約10分。',
    descEn: 'Winter-only snow-view open-air bath. Soaking in hot spring while gazing at snowscapes — the ultimate winter luxury in Karuizawa. About 10 minutes away.',
    accessZh: '距别墅约10分钟车程', accessJa: '別荘から車で約10分', accessEn: 'About 10 min by car from the villa',
  },
  {
    season: 'winter', isFeatured: false, displayOrder: 2, distanceMin: 15,
    nameZh: '轻井泽冰上公园', nameJa: 'アイスパーク（スケート）', nameEn: 'Karuizawa Ice Park',
    descZh: '轻井泽王子大饭店内的正式冰上运动场，冬季开放溜冰。可租借冰刀，适合全家老少同乐。',
    descJa: '軽井沢プリンスホテル内の本格的なアイスリンク。スケート靴のレンタルあり、家族みんなで楽しめる。',
    descEn: 'A full-size ice rink within the Karuizawa Prince Hotel. Skate rentals available — fun for the whole family.',
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
  {
    season: 'winter', isFeatured: false, displayOrder: 3, distanceMin: 12,
    nameZh: '轻井泽圣诞市集', nameJa: 'クリスマスマーケット', nameEn: 'Karuizawa Christmas Market',
    descZh: '以德国正宗圣诞市集为原型的冬季活动，在星野度假区举办。夜晚灯光璀璨，工艺品摊位与热葡萄酒营造出浓郁的节日气氛。',
    descJa: 'ドイツ本場のクリスマスマーケットをモデルにしたイベントが星野リゾートで開催。夜の光と手工芸品、グリューワインで祝祭ムードを満喫。',
    descEn: 'A German-style Christmas Market hosted at Hoshino Resort. Evening lights, handcrafts, and mulled wine create a festive winter atmosphere.',
    accessZh: '距别墅约12分钟车程', accessJa: '別荘から車で約12分', accessEn: 'About 12 min by car from the villa',
  },
  {
    season: 'winter', isFeatured: false, displayOrder: 4, distanceMin: 15,
    nameZh: '轻井泽王子购物广场', nameJa: '軽井沢・プリンスショッピングプラザ', nameEn: 'Karuizawa Prince Shopping Plaza',
    descZh: '日本最大规模的奥特莱斯之一，汇聚了超过220家品牌店铺，包括Gucci、Prada等顶级奢侈品牌。支持免税及微信支付，别墅距此约15分钟车程。',
    descJa: '国内最大級のアウトレットモール。グッチ・プラダ等の高級ブランドを含む220店舗以上が集結。免税・WeChat Pay対応。別荘から車で約15分。',
    descEn: "One of Japan's largest outlet malls with over 220 stores including Gucci and Prada. Tax-free shopping and WeChat Pay available. About 15 minutes from the villa.",
    accessZh: '距别墅约15分钟车程', accessJa: '別荘から車で約15分', accessEn: 'About 15 min by car from the villa',
  },
];

export async function seedSeasonsIfEmpty(isTest = false): Promise<void> {
  const db = getDb(isTest);
  const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM seasons') as any[][];
  if (rows[0].cnt > 0) return;
  for (const s of DEFAULT_SEASONS) {
    await db.query(
      `INSERT INTO seasons
         (season, name_zh, name_ja, name_en, desc_zh, desc_ja, desc_en,
          access_zh, access_ja, access_en, distance_min, is_featured, display_order, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [
        s.season, s.nameZh, s.nameJa, s.nameEn,
        s.descZh, s.descJa, s.descEn,
        s.accessZh, s.accessJa, s.accessEn,
        s.distanceMin, s.isFeatured ? 1 : 0, s.displayOrder,
      ],
    );
  }
  console.log('[db] seasons seeded with', DEFAULT_SEASONS.length, 'spots');
}

// Default surroundings spots — seeded once when table is empty
const DEFAULT_SPOTS = [
  { id: 'shiraito',     category: 'nature',   nameZh: '白丝瀑布',         nameJa: '白糸の滝',             nameEn: 'Shiraito Falls',
    descZh: '日本三大瀑布之一，如白丝般细腻流淌的美丽瀑布，四季各有不同魅力。',
    descJa: '日本三大瀑布のひとつ、白糸のように繊細に流れる美しい滝で、四季それぞれに異なる魅力があります。',
    descEn: "One of Japan's three great waterfalls, flowing delicately like white silk with unique charm in each season.",
    distance: 15, tagsZh: ['自然景观','徒步'], tagsJa: ['自然景観','ハイキング'], tagsEn: ['Natural Scenery','Hiking'], sort: 0 },
  { id: 'asama',        category: 'nature',   nameZh: '浅间山',           nameJa: '浅間山',               nameEn: 'Mt. Asama',
    descZh: '日本最活跃的火山之一，雄伟的姿态与神秘的云雾构成绝美的自然景观。',
    descJa: '日本で最も活発な火山のひとつで、雄大な姿と神秘的な霧が絶美な自然景観を作り出しています。',
    descEn: "One of Japan's most active volcanoes, its majestic form and mysterious mist create a breathtaking natural landscape.",
    distance: 5,  tagsZh: ['火山景观','摄影'],  tagsJa: ['火山景観','写真'],      tagsEn: ['Volcanic Scenery','Photography'], sort: 1 },
  { id: 'kumoba',       category: 'nature',   nameZh: '云场池',           nameJa: '雲場池',               nameEn: 'Kumoba Pond',
    descZh: '被誉为"轻井泽之眼"，秋季红叶倒映水中，如诗如画。',
    descJa: '「軽井沢の瞳」と称されるこの池は、秋の紅葉が水面に映り、詩のような絵画のような美しさです。',
    descEn: 'Known as the "Eye of Karuizawa", autumn foliage reflected on the water creates a poetic, painting-like beauty.',
    distance: 8,  tagsZh: ['季节景色','散步'],  tagsJa: ['季節の景色','散歩'],   tagsEn: ['Seasonal Scenery','Walking'], sort: 2 },
  { id: 'stone-church', category: 'culture',  nameZh: '石之教堂',         nameJa: '石の教会',             nameEn: 'Stone Church',
    descZh: '建筑师肯德里克·班斯的杰作，以自然石材和玻璃构成的现代主义教堂，与自然融为一体。',
    descJa: '建築家ケンドリック・バンスの傑作で、天然石とガラスで構成されたモダニズムの教会が自然と一体化しています。',
    descEn: 'A masterpiece by architect Kendrick Bangs, this modernist church of natural stone and glass merges with nature.',
    distance: 10, tagsZh: ['建筑艺术','文化遗产'], tagsJa: ['建築芸術','文化遺産'], tagsEn: ['Architecture','Cultural Heritage'], sort: 3 },
  { id: 'sezon-museum', category: 'culture',  nameZh: '軽井泽现代美术馆', nameJa: '軽井沢現代美術館',   nameEn: 'Karuizawa Museum of Modern Art',
    descZh: '收藏包括毕加索、达利等世界名家作品，森林包围中的艺术殿堂。',
    descJa: 'ピカソやダリなどの世界的巨匠の作品を収蔵する、森に囲まれた芸術の殿堂です。',
    descEn: 'Housing works by world masters including Picasso and Dali, an art temple surrounded by forest.',
    distance: 12, tagsZh: ['艺术','室内景点'], tagsJa: ['芸術','屋内スポット'], tagsEn: ['Art','Indoor Attraction'], sort: 4 },
  { id: 'ginza',        category: 'shopping', nameZh: '旧银座商店街',     nameJa: '旧軽銀座商店街',       nameEn: 'Old Ginza Shopping Street',
    descZh: '拥有百年历史的购物街，汇集了轻井泽知名品牌、工艺品和特色美食，漫步其中感受轻井泽的悠久历史。',
    descJa: '百年の歴史を誇るショッピングストリートで、軽井沢の有名ブランド、工芸品、特色グルメが集まっています。',
    descEn: "A shopping street with centennial history, gathering Karuizawa's famous brands, crafts, and specialty foods.",
    distance: 10, tagsZh: ['购物','特产'], tagsJa: ['ショッピング','特産品'], tagsEn: ['Shopping','Local Specialties'], sort: 5 },
  { id: 'hoshino-onsen',category: 'activity', nameZh: '星野温泉蜻蜓之汤', nameJa: '星野温泉 とんぼの湯', nameEn: 'Hoshino Onsen Tonbo-no-yu',
    descZh: '轻井泽最负盛名的温泉设施，泡汤同时欣赏森林美景，彻底放松身心。',
    descJa: '軽井沢で最も有名な温泉施設で、森の美景を眺めながら入浴し、心身を完全にリラックスできます。',
    descEn: "Karuizawa's most famous onsen facility, relax completely while enjoying forest views.",
    distance: 5,  tagsZh: ['温泉','放松'], tagsJa: ['温泉','リラクゼーション'], tagsEn: ['Onsen','Relaxation'], sort: 6 },
  { id: 'harunire',     category: 'shopping', nameZh: '榆树街小镇',       nameJa: 'ハルニレテラス',       nameEn: 'Harunire Terrace',
    descZh: '依偎在古老榆树群中的精品商业空间，包含餐厅、咖啡馆和精选商店，是轻井泽最受欢迎的休闲场所之一。',
    descJa: '古いハルニレの木立に囲まれたブティック商業空間で、レストラン、カフェ、厳選ショップを含む軽井沢で最人気の憩いの場です。',
    descEn: 'A boutique commercial space nestled among old elm trees, featuring restaurants, cafes, and selected shops.',
    distance: 5,  tagsZh: ['购物','餐饮'], tagsJa: ['ショッピング','グルメ'], tagsEn: ['Shopping','Dining'], sort: 7 },
  { id: 'gourmet-french', category: 'gourmet', nameZh: '轻井泽法式餐厅', nameJa: '軽井沢フレンチレストラン', nameEn: 'Karuizawa French Restaurant',
    descZh: '汇聚日本顶级法式料理大师，在轻井泽的自然环境中享受一流的欧陆风情。',
    descJa: '日本トップクラスのフレンチシェフが集まり、軽井沢の自然環境の中でトップクラスのヨーロッパ料理を楽しめます。',
    descEn: "Gathering Japan's top French cuisine masters, enjoy first-class European cuisine in Karuizawa's natural setting.",
    distance: 8,  tagsZh: ['法式料理','高端餐饮'], tagsJa: ['フレンチ','高級グルメ'], tagsEn: ['French Cuisine','Fine Dining'], sort: 8 },
];

export async function seedSurroundingsIfEmpty(): Promise<void> {
  const db = getDb();
  const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM surroundings_spots') as any[][];
  if (rows[0].cnt > 0) return;
  for (const s of DEFAULT_SPOTS) {
    await db.query(
      `INSERT IGNORE INTO surroundings_spots
         (id, category, name_zh, name_ja, name_en, description_zh, description_ja, description_en,
          distance, image_url, tags_zh, tags_ja, tags_en, visible, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
      [s.id, s.category, s.nameZh, s.nameJa, s.nameEn,
       s.descZh, s.descJa, s.descEn, s.distance, '',
       JSON.stringify(s.tagsZh), JSON.stringify(s.tagsJa), JSON.stringify(s.tagsEn), s.sort],
    );
  }
  console.log('[db] surroundings_spots seeded');
}

// ─── Announcements ────────────────────────────────────────────────────────────

const ANNOUNCEMENTS_DDL = `CREATE TABLE IF NOT EXISTS announcements (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  message_cn     TEXT NOT NULL,
  message_ja     TEXT NOT NULL,
  message_en     TEXT NOT NULL,
  starts_at      DATETIME NOT NULL,
  ends_at        DATETIME DEFAULT NULL,
  is_active      TINYINT(1) DEFAULT 1,
  style_variant  ENUM('default','important') DEFAULT 'default',
  scroll_speed   INT DEFAULT 30,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

export async function ensureAnnouncementsTable(isTest = false): Promise<void> {
  const db = getDb(isTest);
  await db.query(ANNOUNCEMENTS_DDL);
}
