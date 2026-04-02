import { NextResponse } from 'next/server';
import { getDb, isTestReq, ensureAnnouncementsTable } from '@/lib/db';

export const dynamic = 'force-dynamic';
const NO_CACHE = { 'Cache-Control': 'no-store' };

function rowToAnnouncement(r: any) {
  return {
    id:           r.id,
    messageCn:    r.message_cn    ?? '',
    messageJa:    r.message_ja    ?? '',
    messageEn:    r.message_en    ?? '',
    startsAt:     r.starts_at,
    endsAt:       r.ends_at       ?? null,
    isActive:     r.is_active     === 1,
    styleVariant: r.style_variant ?? 'default',
    scrollSpeed:  r.scroll_speed  ?? 30,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  };
}

// GET /api/admin/announcements — list all
export async function GET(request: Request) {
  try {
    const isTest = isTestReq(request);
    await ensureAnnouncementsTable(isTest);
    const db = getDb(isTest);
    const [rows] = await db.query(
      'SELECT * FROM announcements ORDER BY created_at DESC',
    ) as any[][];
    return NextResponse.json(
      { announcements: (rows as any[]).map(rowToAnnouncement) },
      { headers: NO_CACHE },
    );
  } catch (err) {
    console.error('[admin/announcements GET]', err);
    return NextResponse.json({ announcements: [] }, { headers: NO_CACHE });
  }
}

// POST /api/admin/announcements — create
export async function POST(request: Request) {
  try {
    const isTest = isTestReq(request);
    await ensureAnnouncementsTable(isTest);
    const db = getDb(isTest);
    const b = await request.json();

    if (!b.messageCn && !b.messageJa && !b.messageEn) {
      return NextResponse.json({ error: 'At least one message field is required' }, { status: 400 });
    }
    if (!b.startsAt) {
      return NextResponse.json({ error: 'startsAt is required' }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO announcements
         (message_cn, message_ja, message_en, starts_at, ends_at, is_active, style_variant, scroll_speed)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        b.messageCn    ?? '',
        b.messageJa    ?? '',
        b.messageEn    ?? '',
        b.startsAt,
        b.endsAt       || null,
        b.isActive !== false ? 1 : 0,
        b.styleVariant === 'important' ? 'important' : 'default',
        b.scrollSpeed  ?? 30,
      ],
    ) as any[];

    const newId = result.insertId;
    const [rows] = await db.query('SELECT * FROM announcements WHERE id = ?', [newId]) as any[][];
    return NextResponse.json(rowToAnnouncement(rows[0]), { status: 201, headers: NO_CACHE });
  } catch (err) {
    console.error('[admin/announcements POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
