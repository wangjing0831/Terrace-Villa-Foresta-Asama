import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const NO_STORE = { 'Cache-Control': 'no-store' };

interface HighlightInput {
  id?: number;
  sortOrder?: number;
  titleZh?: string; titleJa?: string; titleEn?: string;
  descriptionZh?: string; descriptionJa?: string; descriptionEn?: string;
  imageUrl?: string;
}

// GET /api/plans/[id]/highlights
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [rows] = await db.query(
      'SELECT * FROM plan_highlights WHERE plan_id = ? ORDER BY sort_order ASC',
      [id],
    ) as any[][];
    const data = rows.map((r: any) => ({
      id:            r.id,
      sortOrder:     r.sort_order,
      titleZh:       r.title_zh        ?? '',
      titleJa:       r.title_ja        ?? '',
      titleEn:       r.title_en        ?? '',
      descriptionZh: r.description_zh  ?? '',
      descriptionJa: r.description_ja  ?? '',
      descriptionEn: r.description_en  ?? '',
      imageUrl:      r.image_url       ?? '',
    }));
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}

// PUT /api/plans/[id]/highlights — replace all
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const items: HighlightInput[] = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected array' }, { status: 400, headers: NO_STORE });
    }
    const db = getDb();
    await db.query('DELETE FROM plan_highlights WHERE plan_id = ?', [id]);
    if (items.length > 0) {
      const values = items.map((item, idx) => [
        id,
        item.sortOrder ?? idx,
        item.titleZh       ?? '',
        item.titleJa       ?? '',
        item.titleEn       ?? '',
        item.descriptionZh ?? '',
        item.descriptionJa ?? '',
        item.descriptionEn ?? '',
        item.imageUrl      ?? '',
      ]);
      await db.query(
        `INSERT INTO plan_highlights
         (plan_id, sort_order, title_zh, title_ja, title_en,
          description_zh, description_ja, description_en, image_url)
         VALUES ?`,
        [values],
      );
    }
    const [rows] = await db.query(
      'SELECT * FROM plan_highlights WHERE plan_id = ? ORDER BY sort_order ASC',
      [id],
    ) as any[][];
    return NextResponse.json(rows, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}
