import type { Metadata, Viewport } from 'next';
import './globals.css';
import { VisitTracker } from '@/components/VisitTracker';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fremwork.com').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fremwork — AI Financial Assistant & Vibe Coding Training',
    template: '%s · Fremwork',
  },
  description:
    'Fremwork is an AI financial assistant for business owners, finance teams, and modern creators. Ask complex financial questions, automate close, and join hands-on vibe coding training.',
  applicationName: 'Fremwork',
  authors: [{ name: 'Fremwork Team', url: siteUrl }],
  generator: 'Next.js',
  keywords: [
    'Fremwork',
    'AI finance',
    'financial assistant',
    'vibe coding',
    'vibe coding training',
    'accounting automation',
    'business finance AI',
    'financial analysis',
    'cash flow runway',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Fremwork',
  publisher: 'Fremwork',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'Fremwork — AI Financial Assistant & Vibe Coding Training',
    description:
      'Ask any finance question in plain language and get a clear answer. Real-time cash runway, month-end checklists, payables, and live training.',
    url: siteUrl,
    siteName: 'Fremwork',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 604,
        height: 128,
        alt: 'Fremwork Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fremwork — AI Financial Assistant',
    description:
      'AI financial assistant for business owners and finance teams. Real-time insights and live vibe coding workshops.',
    site: '@fremworkhq',
    creator: '@fremworkhq',
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'finance',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Fremwork',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        sameAs: [
          'https://x.com/fremworkhq',
          'https://www.linkedin.com/company/fremworkhq',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@fremwork.com',
          contactType: 'customer support',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Fremwork',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Fremwork',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <VisitTracker />
      </body>
    </html>
  );
}
