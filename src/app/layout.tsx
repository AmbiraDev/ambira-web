import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthInitializer } from '@/components/AuthInitializer';
import { DataPrefetcher } from '@/components/DataPrefetcher';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeColorProvider } from '@/providers/ThemeColorProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PWAInstaller from '@/components/PWAInstaller';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap', // Add font-display: swap for better FCP
  preload: true, // Preload the font for better performance
});

export const metadata: Metadata = {
  title: 'Ambira',
  description:
    'Track your productivity, build streaks, and stay motivated with friends. The social way to achieve your goals.',
  keywords: [
    'productivity',
    'tracking',
    'social',
    'goals',
    'habits',
    'studying',
    'work',
  ],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ambira',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme color: White for all pages including loading screen */}
        <meta name="theme-color" content="#ffffff" />

        {/* Viewport fit for safe area insets (iPhone notch support) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeColorProvider>
            <PWAInstaller />
            <QueryProvider>
              <AuthInitializer>
                <DataPrefetcher />
                {children}
              </AuthInitializer>
            </QueryProvider>
            <Analytics />
            <SpeedInsights />
          </ThemeColorProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
