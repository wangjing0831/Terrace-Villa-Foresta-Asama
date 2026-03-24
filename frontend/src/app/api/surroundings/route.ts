import { NextResponse } from 'next/server';
import { getDb, runMigration, seedSurroundingsIfEmpty } from '@/lib/db';

export const dynamic = 'force-dynamic';
const NO_CACHE = { 'Cache-Control': 'no-store' };

function rowToSpot(r: any) {
  return {
    id:            r.id,
    category:      r.category      ?? 'nature',
    nameZh:        r.name_zh       ?? '',
    nameJa:        r.name_ja       ?? '',
    nameEn:        r.name_en       ?? '',
    descriptionZh: r.description_zh ?? '',
    descriptionJa: r.description_ja ?? '',
    descriptionEn: r.description_en ?? '',
    distance:      r.distance      ?? 0,
    imageUrl:      r.image_url     ?? '',
    tagsZh:        r.tags_zh       ?? [],
    tagsJa:        r.tags_ja       ?? [],
    tagsEn:        r.tags_en       ?? [],
    visible:       r.visible       === 1,
    sortOrder:     r.sort_order    ?? 0,
  };
}

export async function GET(request: Request) {
  try {
    await runMigration();
    await seedSurroundingsIfEmpty();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin') === '1';
    const [rows] = await db.query(
      admin
        ? 'SELECT * FROM surroundings_spots ORDER BY sort_order, created_at'
        : 'SELECT * FROM surroundings_spots WHERE visible=1 ORDER BY sort_order, created_at',
    ) as any[][];
    return NextResponse.json((rows as any[]).map(rowToSpot), { headers: NO_CACHE });
  } catch (err) {
    console.error('[surroundings GET]', err);
    return NextResponse.json([], { headers: NO_CACHE });
  }
}

export async function PUT(request: Request) {
  try {
    const b = await request.json();
    const db = getDb();
    await db.query(
      `INSERT INTO surroundings_spots
         (id, category, name_zh, name_ja, name_en,
          description_zh, description_ja, description_en,
          distance, image_url, tags_zh, tags_ja, tags_en, visible, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         category       = VALUES(category),
         name_zh        = VALUES(name_zh),
         name_ja        = VALUES(name_ja),
         name_en        = VALUES(name_en),
         description_zh = VALUES(description_zh),
         description_ja = VALUES(description_ja),
         description_en = VALUES(description_en),
         distance       = VALUES(distance),
         image_url      = VALUES(image_url),
         tags_zh        = VALUES(tags_zh),
         tags_ja        = VALUES(tags_ja),
         tags_en        = VALUES(tags_en),
         visible        = VALUES(visible),
         sort_order     = VALUES(sort_order)`,
      [
        b.id, b.category ?? 'nature',
        b.nameZh ?? '', b.nameJa ?? '', b.nameEn ?? '',
        b.descriptionZh ?? '', b.descriptionJa ?? '', b.descriptionEn ?? '',
        b.distance ?? 0, b.imageUrl ?? '',
        JSON.stringify(b.tagsZh ?? []),
        JSON.stringify(b.tagsJa ?? []),
        JSON.stringify(b.tagsEn ?? []),
        b.visible ? 1 : 0,
        b.sortOrder ?? 0,
      ],
    );
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[surroundings PUT]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
