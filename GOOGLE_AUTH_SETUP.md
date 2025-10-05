# Google Authentication Setup Instructions

Google sign-in has been implemented in the code. To enable it, you need to configure the Google authentication provider in Firebase Console.

## Steps to Enable Google Authentication

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project

2. **Navigate to Authentication**
   - In the left sidebar, click on "Build" > "Authentication"
   - Click on the "Sign-in method" tab

3. **Enable Google Provider**
   - Find "Google" in the list of sign-in providers
   - Click on "Google"
   - Toggle the "Enable" switch to ON
   - Configure the following:
     - **Project support email**: Select or enter an email address (required for the OAuth consent screen)
     - **Public-facing name**: Your app name (optional but recommended)
   - Click "Save"

4. **Authorized Domains (if needed)**
   - By default, Firebase allows localhost and your Firebase Hosting domain
   - If you're deploying to a custom domain, add it to the authorized domains list
   - This is in the same "Sign-in method" tab under "Authorized domains"

## What's Been Implemented

### Code Changes Made:
1. ✅ Added Google OAuth imports to firebaseApi.ts
2. ✅ Implemented `signInWithGoogle()` function in firebaseApi
3. ✅ Added `signInWithGoogle()` to AuthContext
4. ✅ Updated AuthContextType interface
5. ✅ Connected Google sign-in buttons in LandingPage
6. ✅ Removed Apple sign-in buttons from LandingPage

### Features:
- Google sign-in popup authentication
- Automatic user profile creation for new Google users
- Username generation from email with conflict resolution
- Profile picture from Google account automatically applied
- Seamless integration with existing authentication flow

## Testing

After enabling Google authentication in Firebase Console:

1. Start your development server: `npm run dev`
2. Navigate to the landing page
3. Click "Continue with Google" or "Sign Up With Google"
4. Select your Google account
5. You should be redirected to the home page as an authenticated user

## Troubleshooting

If you encounter issues:

1. **"Popup blocked"**: Make sure your browser isn't blocking popups
2. **"Auth domain not authorized"**: Add your domain to authorized domains in Firebase Console
3. **"API not enabled"**: Enable the Google Identity Toolkit API in Google Cloud Console
4. **Username conflicts**: The code automatically handles this by appending numbers

## Security Notes

- Google authentication uses Firebase's secure OAuth 2.0 flow
- User credentials are never stored in your application
- Firebase handles all token management and security
- Firestore security rules apply to all authenticated users regardless of sign-in method
