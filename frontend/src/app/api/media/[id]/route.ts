import { NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MANIFEST_PATH = path.join(process.cwd(), 'data', 'media-manifest.json');

interface MediaEntry {
  id: string;
  url: string;
  category: string;
  isHero: boolean;
  [key: string]: unknown;
}

async function readManifest(): Promise<MediaEntry[]> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveManifest(entries: MediaEntry[]) {
  await writeFile(MANIFEST_PATH, JSON.stringify(entries, null, 2), 'utf-8');
}

// PATCH /api/media/reorder — body: { order: string[], category: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id !== 'reorder') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const { order, category }: { order: string[]; category: string } = await request.json();
    if (!Array.isArray(order) || !category) {
      return NextResponse.json({ error: 'order and category are required' }, { status: 400 });
    }
    const manifest = await readManifest();
    const catItemsOrdered = order
      .map((oid) => manifest.find((e) => e.id === oid))
      .filter(Boolean) as MediaEntry[];
    let catIdx = 0;
    const reordered = manifest.map((e) =>
      e.category === category ? (catItemsOrdered[catIdx++] ?? e) : e
    );
    await saveManifest(reordered);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/media/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const manifest = await readManifest();
    const entry = manifest.find((e) => e.id === id);

    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', entry.url);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    const updated = manifest.filter((e) => e.id !== id);
    await saveManifest(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/media/[id]
// body: { category?, isHero?, name? } → update category and/or isHero flag and/or display name
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: { category?: string; isHero?: boolean; name?: string } = await request.json().catch(() => ({}));
    const manifest = await readManifest();

    let updated: MediaEntry[];

    if (body.category !== undefined) {
      // Update category (and optionally isHero)
      updated = manifest.map((e) => {
        if (e.id !== id) return e;
        const entry = { ...e, category: body.category! };
        if (body.isHero !== undefined) entry.isHero = body.isHero;
        return entry;
      });
    } else if (body.isHero !== undefined) {
      // Only update isHero (when hero star toggled without category change)
      updated = manifest.map((e) =>
        e.id === id ? { ...e, isHero: body.isHero! } : e
      );
    } else {
      // Legacy: set as hero (body is empty)
      updated = manifest.map((e) => ({
        ...e,
        isHero: e.id === id ? true : e.category === 'hero' ? false : e.isHero,
      }));
    }

    // Apply name update if provided
    if (body.name !== undefined) {
      updated = updated.map((e) => e.id === id ? { ...e, name: body.name! } : e);
    }

    await saveManifest(updated);
    const entry = updated.find((e) => e.id === id);
    return NextResponse.json(entry ?? { error: 'Not found' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
