import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LAYOUTS_PATH = path.join(process.cwd(), 'data', 'page-layouts.json');

const DEFAULT_LAYOUTS: Record<string, string[]> = {
  'home.hero': [],
  'home.hotel': [],
  'home.surroundings': [],
  'gallery.hotel': [],
  'gallery.surroundings': [],
  'surroundings.spots': [],
};

async function readLayouts(): Promise<Record<string, string[]>> {
  try {
    const raw = await readFile(LAYOUTS_PATH, 'utf-8');
    return { ...DEFAULT_LAYOUTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LAYOUTS };
  }
}

export async function GET() {
  try {
    return NextResponse.json(await readLayouts());
  } catch (err) {
    return NextResponse.json(DEFAULT_LAYOUTS);
  }
}

export async function PUT(request: Request) {
  try {
    const layouts: Record<string, string[]> = await request.json();
    const dir = path.dirname(LAYOUTS_PATH);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(LAYOUTS_PATH, JSON.stringify(layouts, null, 2), 'utf-8');
    return NextResponse.json(layouts);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
