import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: 'حزب مستقبل وطن | منظومة خدمة المواطنين - لجنة رعاية الشباب',
  description: 'المنظومة الإلكترونية الرسمية لحزب مستقبل وطن لتلقي ودراسة شكاوى وطلبات ومقترحات قطاع الشباب.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#133063',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className={`${ibmPlexArabic.className} min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-100 selection:text-[#133063]`}>
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
