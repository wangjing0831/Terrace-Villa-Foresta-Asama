import { NextResponse } from 'next/server';
import { getDb, isTestReq, runMigration } from '@/lib/db';
import { putS3 } from '@/lib/s3';

export const runtime = 'nodejs';

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files    = formData.getAll('files') as File[];
    const category = (formData.get('category') as string | null) || 'uncategorized';

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const isTest = isTestReq(request);
    await runMigration(isTest);
    const db = getDb(isTest);
    const results = [];

    for (const file of files) {
      if (!file.size) continue;

      const buffer    = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const id        = `${timestamp}-${Math.random().toString(36).slice(2)}`;
      const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Key     = `uploads/${category}/${timestamp}-${safeName}`;
      const type      = file.type.startsWith('video/') ? 'video' : 'image';
      const today     = new Date().toISOString().split('T')[0];
      const size      = formatSize(file.size);

      const url = await putS3(s3Key, buffer, file.type || 'application/octet-stream', isTest);

      await db.query(
        `INSERT INTO media (id, name, url, type, category, size, upload_date, s3_key, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, file.name, url, type, category, size, today, s3Key],
      );

      results.push({ id, name: file.name, url, type, category, size, uploadDate: today, isHero: false, s3Key });
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
