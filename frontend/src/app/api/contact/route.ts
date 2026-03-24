import { NextResponse } from 'next/server';
import { getDb, runMigration } from '@/lib/db';

export const dynamic = 'force-dynamic';

const NO_CACHE = { 'Cache-Control': 'no-store' };

function rowToContact(r: any) {
  return {
    phone:        r.phone        ?? '',
    phoneVisible: r.phone_visible  === 1,
    email:        r.email        ?? '',
    emailVisible: r.email_visible  === 1,
    lineId:       r.line_id      ?? '',
    lineQrUrl:    r.line_qr_url  ?? '',
    lineVisible:  r.line_visible   === 1,
    wechatId:     r.wechat_id    ?? '',
    wechatQrUrl:  r.wechat_qr_url ?? '',
    wechatVisible:r.wechat_visible === 1,
  };
}

const EMPTY = {
  phone: '', phoneVisible: true,
  email: '', emailVisible: true,
  lineId: '', lineQrUrl: '', lineVisible: true,
  wechatId: '', wechatQrUrl: '', wechatVisible: true,
};

export async function GET() {
  try {
    await runMigration();
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM contact_info WHERE id = 1') as any[][];
    return NextResponse.json(rows.length ? rowToContact(rows[0]) : EMPTY, { headers: NO_CACHE });
  } catch (err) {
    console.error('[contact GET]', err);
    return NextResponse.json(EMPTY, { headers: NO_CACHE });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    await db.query(
      `INSERT INTO contact_info
         (id, phone, phone_visible, email, email_visible,
          line_id, line_qr_url, line_visible,
          wechat_id, wechat_qr_url, wechat_visible)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         phone          = VALUES(phone),
         phone_visible  = VALUES(phone_visible),
         email          = VALUES(email),
         email_visible  = VALUES(email_visible),
         line_id        = VALUES(line_id),
         line_qr_url    = VALUES(line_qr_url),
         line_visible   = VALUES(line_visible),
         wechat_id      = VALUES(wechat_id),
         wechat_qr_url  = VALUES(wechat_qr_url),
         wechat_visible = VALUES(wechat_visible)`,
      [
        body.phone        ?? '',
        body.phoneVisible  ? 1 : 0,
        body.email        ?? '',
        body.emailVisible  ? 1 : 0,
        body.lineId       ?? '',
        body.lineQrUrl    ?? '',
        body.lineVisible   ? 1 : 0,
        body.wechatId     ?? '',
        body.wechatQrUrl  ?? '',
        body.wechatVisible ? 1 : 0,
      ],
    );
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  } catch (err) {
    console.error('[contact PUT]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
