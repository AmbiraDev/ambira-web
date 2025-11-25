import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/:path*',
        headers: [
          {
            // Disable COOP to allow Firebase Auth popups to work properly
            // Google Sign-In requires access to popup window properties
            // Note: Using 'unsafe-none' is necessary for OAuth flows
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            // Content Security Policy - Restrict resource loading to trusted sources
            // Allows Firebase, Google APIs, and Sentry while blocking XSS attacks
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.sentry.io",
              'frame-src https://accounts.google.com https://*.firebaseapp.com',
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            // Prevent clickjacking attacks by controlling iframe embedding
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Prevent MIME type sniffing that could lead to XSS attacks
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Enforce HTTPS connections for security
            // max-age: 2 years, includeSubDomains, preload for Chrome HSTS list
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Control referrer information sent with requests
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Restrict browser features and APIs to enhance privacy
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/feed',
        destination: '/',
        permanent: true,
      },
    ]
  },
  eslint: {
    // Enable ESLint during builds to catch issues before deployment
    // Linting also runs via `npm run lint`
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Type checking is now enabled for production builds
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    qualities: [75, 90, 95, 100],
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'ambira',

  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
})
