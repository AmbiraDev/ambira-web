/**
 * Sentry Configuration Utilities
 *
 * Provides runtime configuration validation and utilities for Sentry error tracking.
 */

export interface SentryConfig {
  dsn: string | undefined;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  debug: boolean;
}

/**
 * Validates and returns the Sentry configuration
 */
export function getSentryConfig(): SentryConfig {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Sentry is disabled in test environment or when DSN is not provided
  const enabled = nodeEnv !== 'test' && Boolean(dsn);

  return {
    dsn,
    environment: nodeEnv,
    enabled,
    // Lower sample rate in production to reduce costs
    tracesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
    // Only enable debug logging in development
    debug: nodeEnv === 'development',
  };
}

/**
 * Validates that the Sentry DSN format is correct
 */
export function validateSentryDsn(dsn: string | undefined): boolean {
  if (!dsn) return false;

  // Basic DSN format validation
  // Format: https://<key>@<organization>.ingest.sentry.io/<project>
  const dsnPattern =
    /^https:\/\/[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io\/\d+$/i;

  return dsnPattern.test(dsn);
}

/**
 * Logs configuration warnings in development
 */
export function logSentryConfigWarnings(config: SentryConfig): void {
  if (config.environment !== 'development') return;

  if (!config.dsn) {
    console.warn(
      '[Sentry] DSN not configured. Error tracking is disabled. Set NEXT_PUBLIC_SENTRY_DSN in .env.local to enable Sentry.'
    );
  } else if (!validateSentryDsn(config.dsn)) {
    console.error(
      '[Sentry] Invalid DSN format. Please check your NEXT_PUBLIC_SENTRY_DSN environment variable.'
    );
  } else {
    console.info('[Sentry] Error tracking enabled in development mode');
  }
}
