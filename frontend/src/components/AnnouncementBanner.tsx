'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type Announcement = {
  id: number;
  message_cn: string;
  message_ja: string;
  message_en: string;
  style_variant: 'default' | 'important';
  scroll_speed: number;
};

export default function AnnouncementBanner() {
  const [data, setData] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { language } = useLanguage();
  const apiBase = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/api';

  useEffect(() => {
    fetch(apiBase + '/announcements/active')
      .then((r) => r.json())
      .then((d) => setData(d.announcement))
      .catch(() => {});
  }, [apiBase]);

  if (!data || dismissed) return null;

  const isImportant = data.style_variant === 'important';
  const message =
    language === 'zh' ? data.message_cn
    : language === 'ja' ? data.message_ja
    : data.message_en;

  const duration = Math.min(40, Math.max(8, message.length / data.scroll_speed * 10));

  const bg      = isImportant ? '#3a2a05' : '#161510';
  const textClr = isImportant ? '#faf0d0' : '#faf8f2';

  return (
    <div style={{ background: bg, height: 38, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 60 }}>
      {/* Left accent */}
      <div style={{ flexShrink: 0, width: isImportant ? 8 : 3, height: '100%', background: '#c9a96e' }} />

      {/* Scrolling text */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 14px' }}>
        <div
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: `banner-scroll ${duration}s linear infinite`,
            paddingLeft: '100%',
            fontSize: 13,
            color: textClr,
            letterSpacing: '0.04em',
          }}
        >
          {message}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        style={{ flexShrink: 0, color: '#c9a96e', fontSize: 16, padding: '0 14px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label="Close"
      >
        ✕
      </button>

      <style>{`
        @keyframes banner-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
