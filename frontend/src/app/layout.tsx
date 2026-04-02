import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBanner from '@/components/AnnouncementBanner';

export const metadata: Metadata = {
  title: 'Terrace Villa Foresta Asama | Karuizawa Luxury Resort',
  description:
    'Experience ultimate luxury at Terrace Villa Foresta Asama in Karuizawa, Japan. Private villas with Mt. Asama views, forest surroundings, and exclusive butler service.',
  keywords: 'Terrace Villa Foresta Asama, Karuizawa, luxury resort, villa, Japan',
  openGraph: {
    title: 'Terrace Villa Foresta Asama',
    description: 'Luxury Villa Resort in Karuizawa, Japan',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cinzel:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          <AnnouncementBanner />
          <Header />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

