# Sentry Error Tracking Setup Guide

This guide explains how to configure Sentry error tracking for the Ambira application.

## Overview

Sentry is configured to:
- Automatically capture and report errors from server, client, and edge runtime
- Track performance with distributed tracing (10% sample rate in production)
- Provide error context with React component stacks
- Gracefully degrade when not configured (no errors or warnings in production)

## Quick Start

### 1. Get Your Sentry DSN

1. Go to [sentry.io](https://sentry.io/) and create an account or sign in
2. Create a new project or select an existing Next.js project
3. Navigate to **Settings > Client Keys (DSN)**
4. Copy your DSN value (format: `https://<key>@<org>.ingest.sentry.io/<project>`)

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Required for error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project

# Optional - only needed for production deployments with source maps
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Note:** If `NEXT_PUBLIC_SENTRY_DSN` is not set or empty, Sentry will be completely disabled with no runtime overhead.

### 3. Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. You should see a console message confirming Sentry is enabled:
   ```
   [Sentry] Error tracking enabled in development mode
   ```

3. Test error reporting by triggering an error in your application

## Configuration Files

### Server Configuration (`sentry.server.config.ts`)

Handles errors from:
- API routes
- Server-side rendering
- Server actions
- Data fetching methods

Features:
- Automatic console error/warning capture
- Component stack traces
- 10% trace sampling in production (reduces costs)

### Edge Configuration (`sentry.edge.config.ts`)

Handles errors from:
- Middleware
- Edge API routes
- Edge runtime functions

Features:
- Lightweight configuration for edge runtime
- Same sampling rates as server config

### Runtime Configuration (`src/lib/sentry-config.ts`)

Centralized configuration utility providing:
- DSN validation
- Environment-based settings
- Configuration warnings in development
- Type-safe configuration interface

## Error Boundaries

The application includes React error boundaries to catch and report rendering errors:

### Global Error Boundary

Located in `src/app/layout.tsx`, wraps the entire application:

```tsx
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

Features:
- Automatically reports errors to Sentry
- Shows user-friendly error UI
- Provides recovery options (try again, reload)
- Displays error details in development
- Fully accessible with keyboard navigation

### Custom Error Boundaries

Create custom error boundaries for specific features:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MyFeature() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorUI />}
      onError={(error, errorInfo) => {
        // Custom error handling
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## Environment-Specific Behavior

### Development
- **Trace Sample Rate:** 100% (all requests traced)
- **Debug Mode:** Enabled (verbose logging)
- **Console Warnings:** Shows if DSN is not configured
- **Error Details:** Full error stack traces visible in UI

### Production
- **Trace Sample Rate:** 10% (cost optimization)
- **Debug Mode:** Disabled
- **Console Warnings:** Suppressed
- **Error Details:** Hidden from users, sent to Sentry

### Test
- **Sentry:** Completely disabled
- **No overhead:** Zero impact on test performance

## Advanced Configuration

### Source Maps Upload

For better error tracking in production, upload source maps to Sentry:

1. Get an auth token from [Sentry Settings > Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Required scopes: `project:releases`, `project:write`
3. Add to `.env.local`:
   ```bash
   SENTRY_AUTH_TOKEN=your_auth_token_here
   ```

Source maps will be automatically uploaded during production builds.

### Custom Error Context

Add custom context to errors:

```typescript
import * as Sentry from '@sentry/nextjs';

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Add custom tags
Sentry.setTag('feature', 'timer');
Sentry.setTag('user_role', 'premium');

// Add breadcrumbs
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User started timer',
  level: 'info',
});
```

### Performance Monitoring

Adjust trace sample rates in `src/lib/sentry-config.ts`:

```typescript
export function getSentryConfig(): SentryConfig {
  return {
    // Adjust these values based on your needs
    tracesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
  };
}
```

**Sample Rate Guidelines:**
- `1.0` = 100% of requests (expensive, only for development)
- `0.1` = 10% of requests (good for production)
- `0.01` = 1% of requests (high-traffic applications)

### Filtering Sensitive Data

Sentry automatically filters sensitive data, but you can customize:

```typescript
// In sentry.server.config.ts
Sentry.init({
  // ... other config
  beforeSend(event, hint) {
    // Don't send certain errors
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }

    // Scrub sensitive data
    if (event.request) {
      delete event.request.cookies;
    }

    return event;
  },
});
```

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify DSN format:**
   - Should start with `https://`
   - Should contain `@` and `.ingest.sentry.io`
   - Should end with a project ID (number)

3. **Check console for warnings:**
   - Look for `[Sentry]` messages in browser/server console
   - Verify "Error tracking enabled" message appears

4. **Test with manual error:**
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   Sentry.captureException(new Error('Test error'));
   ```

### Source Maps Not Uploading

1. **Verify auth token is set:**
   ```bash
   echo $SENTRY_AUTH_TOKEN
   ```

2. **Check token scopes:**
   - Go to [Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
   - Ensure token has `project:releases` and `project:write` scopes

3. **Review build logs:**
   - Source map upload happens during `npm run build`
   - Look for Sentry upload messages in build output

### Development Warnings

If you see warnings in development:

```
[Sentry] DSN not configured. Error tracking is disabled.
```

This is expected if you haven't set `NEXT_PUBLIC_SENTRY_DSN`. To enable:

1. Copy `.env.example` to `.env.local`
2. Add your Sentry DSN
3. Restart the dev server

## Security Considerations

- **DSN is public:** The `NEXT_PUBLIC_SENTRY_DSN` is safe to expose in client code
- **Auth token is secret:** Never commit `SENTRY_AUTH_TOKEN` to version control
- **Rate limiting:** Sentry has built-in rate limiting to prevent abuse
- **Data scrubbing:** Sensitive data is automatically filtered before sending

## Best Practices

1. **Always use error boundaries** for critical UI sections
2. **Add context** to errors with `setUser()`, `setTag()`, and breadcrumbs
3. **Monitor error budgets** in Sentry dashboard
4. **Set up alerts** for critical errors
5. **Review errors regularly** and fix high-priority issues
6. **Use releases** to track which version introduced errors
7. **Sample traces** aggressively in production to control costs

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Error Boundaries](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/performance/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)

## Support

If you encounter issues:

1. Check the [Sentry Status Page](https://status.sentry.io/)
2. Review [Sentry Documentation](https://docs.sentry.io/)
3. Search [Sentry GitHub Issues](https://github.com/getsentry/sentry-javascript/issues)
4. Contact the development team
