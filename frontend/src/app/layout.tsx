import type { Metadata } from 'next';
import { Prompt, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastContainer } from '@/components/ui/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const prompt = Prompt({
  variable: '--font-prompt',
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nature MiniPlex — ระบบจองตั๋วภาพยนตร์',
  description: 'จองตั๋วภาพยนตร์ออนไลน์ Nature MiniPlex โรงหนังศรีราชาและบางแสน ง่าย สะดวก รวดเร็ว',
  keywords: ['โรงหนัง', 'จองตั๋ว', 'Nature MiniPlex', 'ศรีราชา', 'บางแสน'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} ${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ConfirmModal />
          <ToastContainer position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
