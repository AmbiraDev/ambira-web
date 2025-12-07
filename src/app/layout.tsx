import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthInitializer } from '@/components/AuthInitializer'
import { DataPrefetcher } from '@/components/DataPrefetcher'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeColorProvider } from '@/providers/ThemeColorProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import PWAInstaller from '@/components/PWAInstaller'
import { ToastProvider } from '@/components/ui/toast'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const dmSans = localFont({
  variable: '--font-dm-sans',
  display: 'swap',
  src: [
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-100-normal.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-100-italic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-200-normal.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-200-italic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-300-italic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-400-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-500-italic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-600-italic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-700-italic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-800-italic.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-900-normal.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../assets/fonts/dm-sans/dm-sans-latin-900-italic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
})

export const metadata: Metadata = {
  title: 'Ambira',
  description:
    'Track your productivity, build streaks, and stay motivated with friends. The social way to achieve your goals.',
  keywords: ['productivity', 'tracking', 'social', 'goals', 'habits', 'studying', 'work'],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ambira',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme color: White for all pages including loading screen */}
        <meta name="theme-color" content="#ffffff" />

        {/* Viewport fit for safe area insets (iPhone notch support) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${dmSans.variable} antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeColorProvider>
            <ToastProvider>
              <PWAInstaller />
              <QueryProvider>
                <AuthInitializer>
                  <DataPrefetcher />
                  {children}
                </AuthInitializer>
              </QueryProvider>
              <Analytics />
              <SpeedInsights />
            </ToastProvider>
          </ThemeColorProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
