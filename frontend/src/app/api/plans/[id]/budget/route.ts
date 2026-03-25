import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const NO_STORE = { 'Cache-Control': 'no-store' };

interface BudgetInput {
  id?: number;
  sortOrder?: number;
  categoryZh?: string; categoryJa?: string; categoryEn?: string;
  amountZh?: string; currencyZh?: string;
  amountJa?: string; currencyJa?: string;
  amountEn?: string; currencyEn?: string;
  noteZh?: string; noteJa?: string; noteEn?: string;
}

// GET /api/plans/[id]/budget
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [rows] = await db.query(
      'SELECT * FROM plan_budget_items WHERE plan_id = ? ORDER BY sort_order ASC',
      [id],
    ) as any[][];
    const data = rows.map((r: any) => ({
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
    }));
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}

// PUT /api/plans/[id]/budget — replace all
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const items: BudgetInput[] = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected array' }, { status: 400, headers: NO_STORE });
    }
    const db = getDb();
    await db.query('DELETE FROM plan_budget_items WHERE plan_id = ?', [id]);
    if (items.length > 0) {
      const values = items.map((item, idx) => [
        id,
        item.sortOrder  ?? idx,
        item.categoryZh ?? '',
        item.categoryJa ?? '',
        item.categoryEn ?? '',
        item.amountZh   ?? '',
        item.currencyZh ?? 'CNY',
        item.amountJa   ?? '',
        item.currencyJa ?? 'JPY',
        item.amountEn   ?? '',
        item.currencyEn ?? 'USD',
        item.noteZh     ?? '',
        item.noteJa     ?? '',
        item.noteEn     ?? '',
      ]);
      await db.query(
        `INSERT INTO plan_budget_items
         (plan_id, sort_order, category_zh, category_ja, category_en,
          amount_zh, currency_zh, amount_ja, currency_ja, amount_en, currency_en,
          note_zh, note_ja, note_en)
         VALUES ?`,
        [values],
      );
    }
    const [rows] = await db.query(
      'SELECT * FROM plan_budget_items WHERE plan_id = ? ORDER BY sort_order ASC',
      [id],
    ) as any[][];
    return NextResponse.json(rows, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: NO_STORE });
  }
}
