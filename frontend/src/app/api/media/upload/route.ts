import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const MANIFEST_PATH = path.join(process.cwd(), 'data', 'media-manifest.json');

interface MediaEntry {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadDate: string;
  url: string;
  type: 'image' | 'video';
  isHero: boolean;
}

async function readManifest(): Promise<MediaEntry[]> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeManifest(entries: MediaEntry[]) {
  const dir = path.dirname(MANIFEST_PATH);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(MANIFEST_PATH, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = (formData.get('category') as string) || 'uncategorized';

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Create upload directory
    const categoryDir = path.join(UPLOADS_DIR, category);
    if (!existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }

    const manifest = await readManifest();
    const newEntries: MediaEntry[] = [];

    for (const file of files) {
      if (!file.size) continue;

      // Generate unique filename
      const timestamp = Date.now();
      const storedName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(categoryDir, storedName);

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      const entry: MediaEntry = {
        id: `${timestamp}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        category,
        size: formatSize(file.size),
        uploadDate: new Date().toISOString().split('T')[0],
        url: `/uploads/${category}/${storedName}`,
        type: fileType,
        isHero: false,
      };

      manifest.unshift(entry);
      newEntries.push(entry);
    }

    await writeManifest(manifest);

    return NextResponse.json(newEntries);
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Upload failed', detail: String(err) },
      { status: 500 }
    );
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
