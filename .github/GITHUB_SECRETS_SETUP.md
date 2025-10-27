# GitHub Secrets Setup for CI/CD

This document explains how to configure GitHub repository secrets for the Playwright CI/CD workflow.

## Problem

The Playwright smoke tests workflow (`playwright.yml`) requires Firebase configuration to build and run the Next.js application. Without proper environment variables, the build fails with:

```
Error [FirebaseError]: Firebase: Error (auth/invalid-api-key).
```

## Solution

The workflow has been updated to use mock Firebase credentials as fallbacks during build if secrets aren't configured. This allows the build to complete, but **for full functionality, you should configure the real Firebase credentials as GitHub secrets**.

## How to Configure GitHub Secrets

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Firebase Configuration Secrets

Click **New repository secret** for each of the following:

| Secret Name                                | Description                  | Example Value                  |
| ------------------------------------------ | ---------------------------- | ------------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase API Key             | `AIzaSyC...`                   |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain         | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase Project ID          | `your-project-id`              |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket      | `your-project.appspot.com`     |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789012`                 |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase App ID              | `1:123456789012:web:abc123...` |

### 3. Get Your Firebase Configuration

You can find these values in your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. Select your web app
6. Copy the configuration values from the `firebaseConfig` object

### 4. Optional: Configure Playwright Base URL

If you want to test against a deployed environment instead of `localhost:3000`:

| Secret Name           | Description                   | Example Value                 |
| --------------------- | ----------------------------- | ----------------------------- |
| `PLAYWRIGHT_BASE_URL` | Base URL for Playwright tests | `https://your-app.vercel.app` |

## Current Behavior

### Without Secrets Configured

- ✅ Build will complete using mock Firebase credentials
- ✅ Server will start
- ⚠️ Tests may fail due to Firebase authentication errors
- ⚠️ Application won't connect to real Firebase services

### With Secrets Configured

- ✅ Build uses real Firebase configuration
- ✅ Full Firebase functionality available
- ✅ Tests can interact with Firebase services
- ✅ Smoke tests can verify authentication flows

## Telemetry Settings

The workflow automatically disables telemetry for cleaner CI output:

- `NEXT_TELEMETRY_DISABLED=1` - Disables Next.js telemetry
- `SENTRY_TELEMETRY_DISABLED=1` - Disables Sentry telemetry warnings

## Verifying Configuration

After adding secrets, trigger a workflow run to verify:

1. Go to **Actions** tab in your repository
2. Select **Playwright Smoke Tests** workflow
3. Click **Run workflow** → **Run workflow**
4. Monitor the build logs to ensure Firebase initialization succeeds

## Security Notes

- These secrets are **repository-level** secrets, available to all workflows
- GitHub masks secret values in workflow logs
- Only use Firebase **web client** credentials (these are safe for client-side use)
- Never commit actual credentials to the repository
- For production deployments, use environment-specific Firebase projects (dev/staging/prod)

## Related Files

- Workflow configuration: `.github/workflows/playwright.yml`
- Firebase initialization: `src/lib/firebase.ts`
- Environment variables template: `.env.example`
