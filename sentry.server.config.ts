// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import {
  getSentryConfig,
  logSentryConfigWarnings,
} from './src/lib/sentry-config';

const config = getSentryConfig();

// Log configuration warnings in development
logSentryConfigWarnings(config);

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

    // Additional server-side specific configuration
    integrations: [
      // Automatically instrument Next.js data fetching methods
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
  });
}
