import { NextResponse } from 'next/server';
import { getDb, isTestReq } from '@/lib/db';

const NO_STORE = { 'Cache-Control': 'no-store' };

interface DayInput {
  dayNumber: number;
  titleZh?: string; titleJa?: string; titleEn?: string;
  activitiesZh?: string[]; activitiesJa?: string[]; activitiesEn?: string[];
  mealMorningZh?: string; mealMorningJa?: string; mealMorningEn?: string;
  mealLunchZh?: string;   mealLunchJa?: string;   mealLunchEn?: string;
  mealDinnerZh?: string;  mealDinnerJa?: string;  mealDinnerEn?: string;
}

// GET /api/plans/[id]/days
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb(isTestReq(request));
    const [rows] = await db.query(
      'SELECT * FROM plan_days WHERE plan_id = ? ORDER BY day_number ASC',
      [id],
    ) as any[][];
    const j = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v) ?? [];
    const data = rows.map((r: any) => ({
      id:            r.id,
      dayNumber:     r.day_number,
      titleZh:       r.title_zh         ?? '',
      titleJa:       r.title_ja         ?? '',
      titleEn:       r.title_en         ?? '',
      activitiesZh:  j(r.activities_zh),
      activitiesJa:  j(r.activities_ja),
      activitiesEn:  j(r.activities_en),
      mealMorningZh: r.meal_morning_zh  ?? '',
      mealMorningJa: r.meal_morning_ja  ?? '',
      mealMorningEn: r.meal_morning_en  ?? '',
      mealLunchZh:   r.meal_lunch_zh    ?? '',
      mealLunchJa:   r.meal_lunch_ja    ?? '',
      mealLunchEn:   r.meal_lunch_en    ?? '',
      mealDinnerZh:  r.meal_dinner_zh   ?? '',
      mealDinnerJa:  r.meal_dinner_ja   ?? '',
      mealDinnerEn:  r.meal_dinner_en   ?? '',
    }));
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}

// PUT /api/plans/[id]/days — replace all
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const items: DayInput[] = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected array' }, { status: 400, headers: NO_STORE });
    }
    const db = getDb(isTestReq(request));
    await db.query('DELETE FROM plan_days WHERE plan_id = ?', [id]);
    if (items.length > 0) {
      const values = items.map((item) => [
        id,
        item.dayNumber,
        item.titleZh        ?? '',
        item.titleJa        ?? '',
        item.titleEn        ?? '',
        JSON.stringify(item.activitiesZh ?? []),
        JSON.stringify(item.activitiesJa ?? []),
        JSON.stringify(item.activitiesEn ?? []),
        item.mealMorningZh  ?? '',
        item.mealMorningJa  ?? '',
        item.mealMorningEn  ?? '',
        item.mealLunchZh    ?? '',
        item.mealLunchJa    ?? '',
        item.mealLunchEn    ?? '',
        item.mealDinnerZh   ?? '',
        item.mealDinnerJa   ?? '',
        item.mealDinnerEn   ?? '',
      ]);
      await db.query(
        `INSERT INTO plan_days
         (plan_id, day_number, title_zh, title_ja, title_en,
          activities_zh, activities_ja, activities_en,
          meal_morning_zh, meal_morning_ja, meal_morning_en,
          meal_lunch_zh, meal_lunch_ja, meal_lunch_en,
          meal_dinner_zh, meal_dinner_ja, meal_dinner_en)
         VALUES ?`,
        [values],
      );
    }
    const [rows] = await db.query(
      'SELECT * FROM plan_days WHERE plan_id = ? ORDER BY day_number ASC',
      [id],
    ) as any[][];
    return NextResponse.json(rows, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}
