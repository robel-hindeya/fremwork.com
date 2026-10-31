import type { Metadata, Viewport } from 'next';
import './globals.css';
import { VisitTracker } from '@/components/VisitTracker';

export const metadata: Metadata = {
  title: { default: 'Fremwork', template: '%s · Fremwork' },
  description: 'Fremwork is an AI financial assistant for business owners and finance teams. Ask a question about your finances. Get a clear answer.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FAFAF8' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        {children}
        <VisitTracker />
      </body>
    </html>
  );
}
