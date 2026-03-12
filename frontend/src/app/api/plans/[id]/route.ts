import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rowToPlan, type PlanEntry } from '../route';

// GET /api/plans/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM plans WHERE id = ?', [id]) as any[][];
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToPlan(rows[0]), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/plans/[id] — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: Partial<PlanEntry> = await request.json();
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];
    const map: Record<keyof PlanEntry, string> = {
      id: 'id', titleZh: 'title_zh', titleJa: 'title_ja', titleEn: 'title_en',
      descZh: 'desc_zh', descJa: 'desc_ja', descEn: 'desc_en',
      duration: 'duration', price: 'price',
      tagZh: 'tag_zh', tagJa: 'tag_ja', tagEn: 'tag_en',
      highlightsZh: 'highlights_zh', highlightsJa: 'highlights_ja', highlightsEn: 'highlights_en',
      coverImage: 'cover_image', visible: 'visible', createdAt: 'created_at',
    };
    for (const [k, col] of Object.entries(map)) {
      if (k === 'id' || !(k in body)) continue;
      const val = (body as any)[k];
      if (k === 'visible') { fields.push(`${col} = ?`); values.push(val ? 1 : 0); }
      else if (Array.isArray(val)) { fields.push(`${col} = ?`); values.push(JSON.stringify(val)); }
      else { fields.push(`${col} = ?`); values.push(val); }
    }
    if (!fields.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    values.push(id);
    await db.query(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM plans WHERE id = ?', [id]) as any[][];
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToPlan(rows[0]));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/plans/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [result] = await db.query('DELETE FROM plans WHERE id = ?', [id]) as any[];
    if (result.affectedRows === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
