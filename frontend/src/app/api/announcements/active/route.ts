import { NextResponse } from 'next/server';
import { getDb, isTestReq, ensureAnnouncementsTable } from '@/lib/db';

export const dynamic = 'force-dynamic';
const NO_CACHE = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  try {
    const isTest = isTestReq(request);
    await ensureAnnouncementsTable(isTest);
    const db = getDb(isTest);

    const [rows] = await db.query(
      `SELECT id, message_cn, message_ja, message_en, starts_at, ends_at, style_variant, scroll_speed
       FROM announcements
       WHERE is_active = 1
         AND starts_at <= NOW()
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY starts_at DESC
       LIMIT 1`,
    ) as any[][];

    const row = (rows as any[])[0] ?? null;
    return NextResponse.json({ announcement: row }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[announcements/active GET]', err);
    return NextResponse.json({ announcement: null }, { headers: NO_CACHE });
  }
}
