import type { Metadata, Viewport } from 'next';
import './globals.css';

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
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0e13',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
