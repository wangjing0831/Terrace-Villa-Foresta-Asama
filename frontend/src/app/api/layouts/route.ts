import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const DEFAULT_LAYOUTS: Record<string, string[]> = {
  'home.hero':            [],
  'home.hotel':           [],
  'home.surroundings':    [],
  'gallery.hotel':        [],
  'gallery.surroundings': [],
  'surroundings.spots':   [],
};

const NO_CACHE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT section_key, image_urls FROM page_layouts') as any[][];
    const layouts = { ...DEFAULT_LAYOUTS };
    for (const r of rows) {
      const urls = typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : r.image_urls;
      layouts[r.section_key] = urls;
    }
    return NextResponse.json(layouts, { headers: NO_CACHE });
  } catch (err) {
    console.error('[layouts GET]', err);
    return NextResponse.json(DEFAULT_LAYOUTS, { headers: NO_CACHE });
  }
}

export async function PUT(request: Request) {
  try {
    const layouts: Record<string, string[]> = await request.json();
    const db = getDb();
    await Promise.all(
      Object.entries(layouts).map(([key, urls]) =>
        db.query(
          `INSERT INTO page_layouts (section_key, image_urls)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE image_urls = VALUES(image_urls)`,
          [key, JSON.stringify(urls)],
        ),
      ),
    );
    return NextResponse.json(layouts);
  } catch (err) {
    console.error('[layouts PUT]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
