'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContactInfo {
  phone: string;        phoneVisible: boolean;
  email: string;        emailVisible: boolean;
  lineId: string;       lineQrUrl: string;  lineVisible: boolean;
  wechatId: string;     wechatQrUrl: string; wechatVisible: boolean;
}

interface Props {
  onClose: () => void;
}

const label = {
  zh: { title: '联系我们', phone: '电话', email: '邮箱', line: 'Line', wechat: '微信', qr: '扫描二维码', id: 'ID', loading: '加载中...', empty: '暂无联系方式' },
  ja: { title: 'お問い合わせ', phone: '電話', email: 'メール', line: 'LINE', wechat: 'WeChat', qr: 'QRコードをスキャン', id: 'ID', loading: '読み込み中...', empty: '連絡先情報がありません' },
  en: { title: 'Contact Us', phone: 'Phone', email: 'Email', line: 'Line', wechat: 'WeChat', qr: 'Scan QR Code', id: 'ID', loading: 'Loading...', empty: 'No contact information available' },
};

export default function ContactModal({ onClose }: Props) {
  const { language } = useLanguage();
  const lang = language as 'zh' | 'ja' | 'en';
  const t = label[lang] ?? label.en;
  const apiBase = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/api';

  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [qrTarget, setQrTarget] = useState<'line' | 'wechat' | null>(null);

  useEffect(() => {
    fetch(apiBase + '/contact')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setInfo(d))
      .catch(() => setInfo(null));
  }, []);

  const hasAny = info && (
    (info.phoneVisible  && info.phone)  ||
    (info.emailVisible  && info.email)  ||
    (info.lineVisible   && (info.lineId || info.lineQrUrl)) ||
    (info.wechatVisible && (info.wechatId || info.wechatQrUrl))
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-gold" />
            <span className="font-display text-gold text-xs uppercase tracking-[0.4em]">{t.title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5 min-h-[120px]">
          {!info ? (
            <p className="text-white/30 text-xs font-display uppercase tracking-widest text-center py-4">{t.loading}</p>
          ) : !hasAny ? (
            <p className="text-white/30 text-xs font-kaiti italic text-center py-4">{t.empty}</p>
          ) : (
            <>
              {/* Phone */}
              {info.phoneVisible && info.phone && (
                <div className="flex items-center gap-4">
                  <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/60 w-16 flex-shrink-0">{t.phone}</span>
                  <a
                    href={`tel:${info.phone}`}
                    className="font-display text-sm text-white/80 hover:text-gold transition-colors tracking-wide"
                  >
                    {info.phone}
                  </a>
                </div>
              )}

              {/* Email */}
              {info.emailVisible && info.email && (
                <div className="flex items-center gap-4">
                  <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/60 w-16 flex-shrink-0">{t.email}</span>
                  <a
                    href={`mailto:${info.email}`}
                    className="font-display text-sm text-white/80 hover:text-gold transition-colors tracking-wide break-all"
                  >
                    {info.email}
                  </a>
                </div>
              )}

              {/* Line */}
              {info.lineVisible && (info.lineId || info.lineQrUrl) && (
                <div className="flex items-start gap-4">
                  <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/60 w-16 flex-shrink-0 mt-1">{t.line}</span>
                  <div className="flex-1">
                    {info.lineId && (
                      <p className="font-display text-sm text-white/80 tracking-wide mb-2">
                        {t.id}: {info.lineId}
                      </p>
                    )}
                    {info.lineQrUrl && (
                      <button
                        onClick={() => setQrTarget(qrTarget === 'line' ? null : 'line')}
                        className="text-[10px] font-display uppercase tracking-widest text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-3 py-1"
                      >
                        {t.qr} {qrTarget === 'line' ? '▲' : '▼'}
                      </button>
                    )}
                    {qrTarget === 'line' && info.lineQrUrl && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={info.lineQrUrl} alt="Line QR" className="w-36 h-36 object-contain border border-white/10" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WeChat */}
              {info.wechatVisible && (info.wechatId || info.wechatQrUrl) && (
                <div className="flex items-start gap-4">
                  <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/60 w-16 flex-shrink-0 mt-1">{t.wechat}</span>
                  <div className="flex-1">
                    {info.wechatId && (
                      <p className="font-display text-sm text-white/80 tracking-wide mb-2">
                        {t.id}: {info.wechatId}
                      </p>
                    )}
                    {info.wechatQrUrl && (
                      <button
                        onClick={() => setQrTarget(qrTarget === 'wechat' ? null : 'wechat')}
                        className="text-[10px] font-display uppercase tracking-widest text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-3 py-1"
                      >
                        {t.qr} {qrTarget === 'wechat' ? '▲' : '▼'}
                      </button>
                    )}
                    {qrTarget === 'wechat' && info.wechatQrUrl && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={info.wechatQrUrl} alt="WeChat QR" className="w-36 h-36 object-contain border border-white/10" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
