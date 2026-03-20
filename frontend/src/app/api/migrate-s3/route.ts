import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const OLD = 'terrace-villa-foresta-asama-prod.s3.ap-northeast-1.amazonaws.com';
const NEW = 'd143jkdkye8i79.cloudfront.net';

export async function GET() {
  try {
    const db = getDb();

    const [mediaResult] = await db.query(
      `UPDATE media SET url = REPLACE(url, ?, ?) WHERE url LIKE ?`,
      [OLD, NEW, `%${OLD}%`],
    ) as any[];

    const [layoutResult] = await db.query(
      `UPDATE page_layouts SET image_urls = REPLACE(CAST(image_urls AS CHAR), ?, ?) WHERE CAST(image_urls AS CHAR) LIKE ?`,
      [OLD, NEW, `%${OLD}%`],
    ) as any[];

    return NextResponse.json({
      success: true,
      mediaRowsUpdated: mediaResult.affectedRows,
      layoutRowsUpdated: layoutResult.affectedRows,
    });
  } catch (err) {
    console.error('[migrate-s3]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
