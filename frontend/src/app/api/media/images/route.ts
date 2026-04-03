import { NextResponse } from 'next/server';
import { getDb, isTestReq, runMigration } from '@/lib/db';
import { normalizeUrl } from '@/lib/s3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const isTest = isTestReq(request);
    await runMigration(isTest);
    const db = getDb(isTest);
    const sql = category
      ? 'SELECT * FROM media WHERE type = ? AND category = ? ORDER BY sort_order ASC, created_at DESC'
      : 'SELECT * FROM media WHERE type = ? ORDER BY sort_order ASC, created_at DESC';
    const params = category ? ['image', category] : ['image'];
    const [rows] = await db.query(sql, params) as any[][];

    return NextResponse.json(rows.map((r: any) => ({
      id:         r.id,
      name:       r.name,
      url:        normalizeUrl(r.url ?? ''),
      type:       r.type,
      category:   r.category,
      size:       r.size,
      uploadDate: r.upload_date,
      isHero:     r.is_hero === 1,
      s3Key:      r.s3_key,
    })), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[media/images]', err);
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}
