import { NextResponse } from 'next/server';
import { getDb, isTestReq, ensureAnnouncementsTable } from '@/lib/db';

export const dynamic = 'force-dynamic';
const NO_CACHE = { 'Cache-Control': 'no-store' };

// PUT /api/admin/announcements/:id — update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const isTest = isTestReq(request);
    await ensureAnnouncementsTable(isTest);
    const db = getDb(isTest);
    const b = await request.json();

    await db.query(
      `UPDATE announcements SET
         message_cn    = ?,
         message_ja    = ?,
         message_en    = ?,
         starts_at     = ?,
         ends_at       = ?,
         is_active     = ?,
         style_variant = ?,
         scroll_speed  = ?
       WHERE id = ?`,
      [
        b.messageCn    ?? '',
        b.messageJa    ?? '',
        b.messageEn    ?? '',
        b.startsAt,
        b.endsAt       || null,
        b.isActive !== false ? 1 : 0,
        b.styleVariant === 'important' ? 'important' : 'default',
        b.scrollSpeed  ?? 30,
        id,
      ],
    );

    const [rows] = await db.query('SELECT * FROM announcements WHERE id = ?', [id]) as any[][];
    if (!(rows as any[]).length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const r = (rows as any[])[0];
    return NextResponse.json({
      id: r.id, messageCn: r.message_cn, messageJa: r.message_ja, messageEn: r.message_en,
      startsAt: r.starts_at, endsAt: r.ends_at ?? null, isActive: r.is_active === 1,
      styleVariant: r.style_variant, scrollSpeed: r.scroll_speed,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[admin/announcements PUT]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/admin/announcements/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const isTest = isTestReq(request);
    await ensureAnnouncementsTable(isTest);
    const db = getDb(isTest);
    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[admin/announcements DELETE]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/admin/announcements/:id — toggle is_active
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const isTest = isTestReq(request);
    await ensureAnnouncementsTable(isTest);
    const db = getDb(isTest);
    const b = await request.json();

    if ('isActive' in b) {
      await db.query('UPDATE announcements SET is_active = ? WHERE id = ?', [b.isActive ? 1 : 0, id]);
    }
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[admin/announcements PATCH]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
