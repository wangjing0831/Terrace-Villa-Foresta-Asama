import { NextResponse } from 'next/server';
import { getDb, isTestReq, runMigration } from '@/lib/db';
import { normalizeUrl } from '@/lib/s3';

export async function GET(request: Request) {
  try {
    const isTest = isTestReq(request);
    await runMigration(isTest);
    const db = getDb(isTest);
    const [rows] = await db.query(
      'SELECT * FROM media WHERE type = ? ORDER BY sort_order ASC, created_at DESC',
      ['video'],
    ) as any[][];

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
    })));
  } catch (err) {
    console.error('[media/videos]', err);
    return NextResponse.json([]);
  }
}
