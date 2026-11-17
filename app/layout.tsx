import './globals.css';
import { DemoBanner } from '@/components/demo/DemoBanner';

export const metadata = {
  title: 'Shield · Demo',
  description:
    'Public portfolio demo of Shield, a sports-business reporting app. Synthetic data, no real people. Built by Jerry Shi.',
  robots: { index: false, follow: false }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className="flex min-h-screen w-full flex-col pb-12">
        {children}
        <DemoBanner />
      </body>
    </html>
  );
}
