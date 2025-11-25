// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { getSentryConfig } from './src/lib/sentry-config'

const config = getSentryConfig()

// Only initialize Sentry if enabled
if (config.enabled && config.dsn) {
  Sentry.init({
    dsn: config.dsn,

    // Performance monitoring sample rate
    tracesSampleRate: config.tracesSampleRate,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Debug mode configuration
    debug: config.debug,

    // Environment name
    environment: config.environment,

    // Enable/disable based on configuration
    enabled: config.enabled,

    // Capture 100% of errors (we sample traces, not errors)
    sampleRate: 1.0,
  })
}
