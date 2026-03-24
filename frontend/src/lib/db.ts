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
