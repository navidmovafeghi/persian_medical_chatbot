// app/layout.js
import './globals.css';
import { Providers } from '@/lib/providers';

export const metadata = {
  title: 'چت‌بات پزشکی فارسی',
  description: 'چت‌بات پزشکی به زبان فارسی برای پاسخ به سوالات پزشکی',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}