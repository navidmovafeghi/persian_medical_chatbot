// app/layout.js
import './globals.css';

export const metadata = {
  title: 'چت‌بات پزشکی فارسی',
  description: 'چت‌بات پزشکی به زبان فارسی برای پاسخ به سوالات پزشکی',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}