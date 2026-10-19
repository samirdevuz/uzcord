import type { Metadata, Viewport } from 'next';
import { Onest, Unbounded } from 'next/font/google';
import './globals.css';

// Ikkala shrift ham lotin va kirill yozuvlarini to'liq qo'llaydi (o‘, g‘, ў, қ ...).
const sans = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'UzCord — O‘zbek Discord serverlari uchun bot',
    template: '%s · UzCord',
  },
  description:
    "UzCord — o'zbek tilida ishlaydigan Discord moderatsiya boti: AutoMod, loglar, ogohlantirishlar, tugmali rollar va boshqaruv paneli.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://uzcord.samirdev.uz'),
  openGraph: {
    title: 'UzCord',
    description: "O'zbek Discord serverlari uchun moderatsiya boti",
    locale: 'uz_UZ',
    type: 'website',
    images: ['/brand/flag.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#080c14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${sans.variable} ${display.variable}`} lang="uz">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
