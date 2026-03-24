import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
const NO_CACHE = { 'Cache-Control': 'no-store' };

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const db = getDb();
    if ('visible' in body) {
      await db.query(
        'UPDATE surroundings_spots SET visible=? WHERE id=?',
        [body.visible ? 1 : 0, params.id],
      );
    }
    if ('sortOrder' in body) {
      await db.query(
        'UPDATE surroundings_spots SET sort_order=? WHERE id=?',
        [body.sortOrder, params.id],
      );
    }
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[surroundings PATCH]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    await db.query('DELETE FROM surroundings_spots WHERE id=?', [params.id]);
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[surroundings DELETE]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
