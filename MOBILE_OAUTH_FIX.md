# Mobile Google OAuth Fix Guide

## Problem
Google sign-in works on desktop but fails on mobile (iOS and Android).

## Root Cause
Mobile OAuth requires proper configuration in Google Cloud Console. The redirect flow needs authorized domains and redirect URIs to be explicitly configured.

## Step-by-Step Fix

### 1. Configure Google Cloud Console OAuth Client

**Go to:** https://console.cloud.google.com/apis/credentials?project=strava-but-productive

1. Find your **OAuth 2.0 Client ID** (Web application)
2. Click the pencil icon to edit

#### A. Add Authorized JavaScript origins

These tell Google which domains can initiate OAuth requests:

```
http://localhost:3000
https://ambira.app
https://ambira.vercel.app
https://strava-but-productive.web.app
https://strava-but-productive.firebaseapp.com
```

**Important:** Don't include trailing slashes or paths!

#### B. Add Authorized redirect URIs

These tell Google where to send users after authentication:

```
http://localhost:3000/__/auth/handler
https://ambira.app/__/auth/handler
https://ambira.vercel.app/__/auth/handler
https://strava-but-productive.web.app/__/auth/handler
https://strava-but-productive.firebaseapp.com/__/auth/handler
```

**The pattern is:** `https://YOUR-DOMAIN/__/auth/handler`

Firebase Auth automatically handles the `/auth/handler` endpoint.

#### C. Save the changes

Click **SAVE** at the bottom of the form.

### 2. Verify Firebase Authentication Settings

**Go to:** https://console.firebase.google.com/project/strava-but-productive/authentication/providers

1. Click on **Google** provider
2. Verify it's **Enabled**
3. Check that your OAuth Client ID and Secret are configured

### 3. Verify Authorized Domains in Firebase

**Go to:** https://console.firebase.google.com/project/strava-but-productive/authentication/settings

Click on **Authorized domains** tab and verify these are listed:

- `localhost`
- `ambira.app`
- `ambira.vercel.app`
- `strava-but-productive.firebaseapp.com`
- `strava-but-productive.web.app`

### 4. Deploy and Test

1. Commit your changes:
   ```bash
   git add -A
   git commit -m "Fix mobile Google OAuth with redirect flow"
   git push
   ```

2. Deploy to Vercel (or your hosting platform)

3. Test on mobile device:
   - iPhone (Safari)
   - Android (Chrome)

### 5. Use the Debug Tool

I've added a debug panel that shows at the bottom of the page:

- **In development:** Shows automatically
- **In production:** Add `?debug=true` to the URL

The debugger shows:
- Whether mobile is detected
- Whether Safari is detected
- Current URL
- Auth domain
- Any errors that occur

Example: `https://ambira.app/?debug=true`

## How It Works Now

### Desktop (Chrome/Firefox)
1. User clicks "Sign in with Google"
2. Opens popup window
3. User signs in with Google
4. Popup closes
5. User is authenticated

### Mobile (iOS/Android) & Safari
1. User clicks "Sign in with Google"
2. Browser redirects to Google (full page)
3. User signs in with Google
4. Browser redirects back to your app at `/__/auth/handler`
5. Firebase processes the authentication
6. User is redirected to home page

## Common Errors and Solutions

### Error: `redirect_uri_mismatch`
**Solution:** Add the exact redirect URI to Google Cloud Console OAuth client

### Error: `unauthorized_domain`
**Solution:** Add the domain to both:
- Google Cloud Console OAuth client (Authorized JavaScript origins)
- Firebase Authentication settings (Authorized domains)

### Error: popup blocked
**Solution:** The code now automatically falls back to redirect flow

### Stuck on loading screen
**Solution:**
1. Check browser console for errors
2. Use the debug tool (`?debug=true`)
3. Verify OAuth configuration
4. Clear browser cache/cookies

## Testing Checklist

- [ ] Desktop Chrome - Popup flow
- [ ] Desktop Safari - Redirect flow
- [ ] iPhone Safari - Redirect flow
- [ ] Android Chrome - Redirect flow
- [ ] Vercel preview deployment
- [ ] Production deployment

## What Changed in the Code

1. **firebaseApi.ts**:
   - Enhanced mobile detection (includes Safari)
   - Added redirect flow for mobile/Safari
   - Added fallback from popup to redirect if blocked
   - Added detailed logging
   - Fixed error handling for `REDIRECT_IN_PROGRESS`

2. **AuthContext.tsx**:
   - Fixed loading state management during redirects
   - Added early return after successful redirect
   - Proper error handling

3. **LandingPage.tsx**:
   - Updated error handling for redirect flow
   - Added AuthDebugger component

4. **Tests**:
   - Added comprehensive test suite (19 tests)
   - All tests passing ✓

## Need Help?

1. Open browser console on mobile device
2. Enable the debug panel with `?debug=true`
3. Copy the debug info and share it
4. Check for specific error messages in console

## References

- Firebase Auth Documentation: https://firebase.google.com/docs/auth/web/google-signin
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- Common OAuth Errors: https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse
