import mysql from 'mysql2/promise';

let pool: mysql.Pool | undefined;

export function getDb(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:                 process.env.DB_HOST     || 'localhost',
      port:                 Number(process.env.DB_PORT || 3306),
      user:                 process.env.DB_USER     || 'root',
      password:             process.env.DB_PASS     || '',
      database:             process.env.DB_NAME     || 'foresta_asama',
      waitForConnections:   true,
      connectionLimit:      5,
      charset:              'utf8mb4',
      connectTimeout:       5000,
      enableKeepAlive:      true,
      keepAliveInitialDelay: 10000,
      // RDS requires SSL; disable for local MySQL by omitting DB_SSL
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
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

  const dbName = process.env.DB_NAME || 'foresta_asama';
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

  console.log('[db] migration complete');
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
