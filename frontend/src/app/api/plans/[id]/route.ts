import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { normalizeUrl } from '@/lib/s3';
import { rowToPlan, type PlanEntry } from '../route';

const NO_STORE = { 'Cache-Control': 'no-store' };

function rowToHighlight(r: any) {
  return {
    id:            r.id,
    sortOrder:     r.sort_order,
    titleZh:       r.title_zh   ?? '',
    titleJa:       r.title_ja   ?? '',
    titleEn:       r.title_en   ?? '',
    descriptionZh: r.description_zh ?? '',
    descriptionJa: r.description_ja ?? '',
    descriptionEn: r.description_en ?? '',
    imageUrl:      normalizeUrl(r.image_url ?? ''),
  };
}

function rowToDay(r: any) {
  const j = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v) ?? [];
  return {
    id:              r.id,
    dayNumber:       r.day_number,
    titleZh:         r.title_zh    ?? '',
    titleJa:         r.title_ja    ?? '',
    titleEn:         r.title_en    ?? '',
    activitiesZh:    j(r.activities_zh),
    activitiesJa:    j(r.activities_ja),
    activitiesEn:    j(r.activities_en),
    mealMorningZh:   r.meal_morning_zh ?? '',
    mealMorningJa:   r.meal_morning_ja ?? '',
    mealMorningEn:   r.meal_morning_en ?? '',
    mealLunchZh:     r.meal_lunch_zh   ?? '',
    mealLunchJa:     r.meal_lunch_ja   ?? '',
    mealLunchEn:     r.meal_lunch_en   ?? '',
    mealDinnerZh:    r.meal_dinner_zh  ?? '',
    mealDinnerJa:    r.meal_dinner_ja  ?? '',
    mealDinnerEn:    r.meal_dinner_en  ?? '',
  };
}

function rowToBudget(r: any) {
  return {
    id:         r.id,
    sortOrder:  r.sort_order,
    categoryZh: r.category_zh  ?? '',
    categoryJa: r.category_ja  ?? '',
    categoryEn: r.category_en  ?? '',
    amountZh:   r.amount_zh    ?? '',
    currencyZh: r.currency_zh  ?? 'CNY',
    amountJa:   r.amount_ja    ?? '',
    currencyJa: r.currency_ja  ?? 'JPY',
    amountEn:   r.amount_en    ?? '',
    currencyEn: r.currency_en  ?? 'USD',
    noteZh:     r.note_zh      ?? '',
    noteJa:     r.note_ja      ?? '',
    noteEn:     r.note_en      ?? '',
  };
}

function rowToFullPlan(plan: any, highlights: any[], days: any[], budget: any[]) {
  const j = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v) ?? [];
  return {
    id:                   plan.id,
    titleZh:              plan.title_zh       ?? '',
    titleJa:              plan.title_ja       ?? '',
    titleEn:              plan.title_en       ?? '',
    prestigeZh:           plan.prestige_zh    ?? '',
    prestigeJa:           plan.prestige_ja    ?? '',
    prestigeEn:           plan.prestige_en    ?? '',
    coverImage:           normalizeUrl(plan.cover_image ?? ''),
    accommodationImages:  j(plan.accommodation_images).map(normalizeUrl),
    conclusionZh:         plan.conclusion_zh  ?? '',
    conclusionJa:         plan.conclusion_ja  ?? '',
    conclusionEn:         plan.conclusion_en  ?? '',
    duration:             plan.duration,
    price:                plan.price          ?? '',
    visible:              plan.visible === 1,
    highlights:           highlights.map(rowToHighlight),
    days:                 days.map(rowToDay),
    budgetItems:          budget.map(rowToBudget),
  };
}

// GET /api/plans/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [[plans], [highlights], [days], [budget]] = await Promise.all([
      db.query('SELECT * FROM plans WHERE id = ?', [id]) as Promise<any[][]>,
      db.query('SELECT * FROM plan_highlights WHERE plan_id = ? ORDER BY sort_order ASC', [id]) as Promise<any[][]>,
      db.query('SELECT * FROM plan_days WHERE plan_id = ? ORDER BY day_number ASC', [id]) as Promise<any[][]>,
      db.query('SELECT * FROM plan_budget_items WHERE plan_id = ? ORDER BY sort_order ASC', [id]) as Promise<any[][]>,
    ]);
    if (!plans.length) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
    return NextResponse.json(rowToFullPlan(plans[0], highlights, days, budget), { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}

// PUT /api/plans/[id] — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: Partial<PlanEntry> & {
      prestigeZh?: string; prestigeJa?: string; prestigeEn?: string;
      accommodationImages?: string[];
      conclusionZh?: string; conclusionJa?: string; conclusionEn?: string;
    } = await request.json();
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<string, string> = {
      titleZh: 'title_zh', titleJa: 'title_ja', titleEn: 'title_en',
      descZh: 'desc_zh', descJa: 'desc_ja', descEn: 'desc_en',
      duration: 'duration', price: 'price',
      tagZh: 'tag_zh', tagJa: 'tag_ja', tagEn: 'tag_en',
      highlightsZh: 'highlights_zh', highlightsJa: 'highlights_ja', highlightsEn: 'highlights_en',
      coverImage: 'cover_image', visible: 'visible',
      prestigeZh: 'prestige_zh', prestigeJa: 'prestige_ja', prestigeEn: 'prestige_en',
      accommodationImages: 'accommodation_images',
      conclusionZh: 'conclusion_zh', conclusionJa: 'conclusion_ja', conclusionEn: 'conclusion_en',
    };

    for (const [k, col] of Object.entries(map)) {
      if (!(k in body)) continue;
      const val = (body as any)[k];
      if (k === 'visible') { fields.push(`${col} = ?`); values.push(val ? 1 : 0); }
      else if (Array.isArray(val)) { fields.push(`${col} = ?`); values.push(JSON.stringify(val)); }
      else { fields.push(`${col} = ?`); values.push(val); }
    }
    if (!fields.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400, headers: NO_STORE });

    values.push(id);
    await db.query(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM plans WHERE id = ?', [id]) as any[][];
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
    return NextResponse.json(rowToPlan(rows[0]), { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}

// DELETE /api/plans/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [result] = await db.query('DELETE FROM plans WHERE id = ?', [id]) as any[];
    if (result.affectedRows === 0) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}
