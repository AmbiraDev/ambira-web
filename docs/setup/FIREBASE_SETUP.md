# Firebase Setup Guide

Complete guide to setting up Firebase for Ambira development. Follow these steps to configure Firebase Authentication, Firestore Database, and deploy security rules.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **npm** package manager (comes with Node.js)
- **Google account** for Firebase Console access
- **Git** installed for cloning the repository

## Step 1: Create Firebase Project

1. **Navigate to Firebase Console**
   - Go to [https://console.firebase.google.com](https://console.firebase.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project" or "Create a project"
   - Enter a project name (e.g., `ambira-dev`, `ambira-staging`, or `ambira-production`)
   - Click "Continue"

3. **Configure Google Analytics** (Optional)
   - For development environments, you can disable Google Analytics
   - For production, enable it and select or create an Analytics account
   - Click "Create project"

4. **Wait for Project Creation**
   - Firebase will set up your project (takes ~30 seconds)
   - Click "Continue" when ready

## Step 2: Enable Authentication Providers

Ambira uses Firebase Authentication for user management with Email/Password and Google sign-in.

### Enable Email/Password Authentication

1. **Navigate to Authentication**
   - In the Firebase Console left sidebar, click "Build" > "Authentication"
   - Click "Get started" if this is your first time

2. **Enable Email/Password Provider**
   - Click on the "Sign-in method" tab
   - Find "Email/Password" in the providers list
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

### Enable Google Authentication

1. **Enable Google Provider**
   - In the "Sign-in method" tab, find "Google"
   - Click on "Google"
   - Toggle "Enable" to ON
   - Select a support email (your email address)
   - Click "Save"

2. **Configure OAuth Consent Screen** (if prompted)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Fill in required fields:
     - App name: "Ambira" (or your app name)
     - User support email: your email
     - Developer contact email: your email
   - Click "Save and Continue"

3. **Add Authorized Domains**
   - Return to Firebase Console > Authentication > Settings
   - Scroll to "Authorized domains"
   - Ensure `localhost` is in the list (added by default)
   - For production, add your production domain (e.g., `ambira.app`)

## Step 3: Create Firestore Database

Ambira uses Firestore as the primary database for users, sessions, groups, challenges, and more.

1. **Navigate to Firestore Database**
   - In the Firebase Console left sidebar, click "Build" > "Firestore Database"
   - Click "Create database"

2. **Select Production Mode**
   - Choose "Start in production mode"
   - This ensures security rules are enforced from the start
   - Click "Next"

   > **Note**: We'll deploy custom security rules in Step 6

3. **Choose Database Location**
   - Select a region close to your users
   - Recommended: `us-central1` (Iowa) for North America
   - For Europe: `europe-west1` (Belgium)
   - For Asia: `asia-northeast1` (Tokyo)
   - Click "Enable"

   > **Warning**: Location cannot be changed after creation

4. **Wait for Database Creation**
   - Firestore will provision your database (takes ~1 minute)

## Step 4: Get Firebase Configuration

You need Firebase configuration values to connect your app to Firebase.

1. **Register Web App**
   - In Firebase Console, go to Project Overview (home icon)
   - Click the web icon (`</>`) to add a web app
   - Alternatively, click "Add app" and select "Web"

2. **Register App**
   - Enter a nickname: "Ambira Web" (or your preference)
   - Check "Also set up Firebase Hosting" if you plan to use Firebase Hosting
   - Click "Register app"

3. **Copy Configuration**
   - Firebase will display your configuration object
   - It looks like this:

   ```javascript
   const firebaseConfig = {
     apiKey: 'AIzaSyA...',
     authDomain: 'your-project.firebaseapp.com',
     projectId: 'your-project-id',
     storageBucket: 'your-project.firebasestorage.app',
     messagingSenderId: '123456789',
     appId: '1:123456789:web:abc123',
     measurementId: 'G-ABC123',
   }
   ```

4. **Keep This Window Open**
   - You'll need these values in the next step
   - Or click "Continue to console" and retrieve them later from Project Settings

## Step 5: Configure Environment Variables

Now configure your local development environment with Firebase credentials.

1. **Create Environment File**
   - In the project root directory, copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   - If `.env.example` doesn't exist, create `.env.local` manually

2. **Add Firebase Configuration**
   - Open `.env.local` in your text editor
   - Fill in the Firebase configuration values from Step 4:

   ```bash
   # Firebase Configuration
   # Get these values from Firebase Console > Project Settings > General > Your apps
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

   # Optional: Google Analytics
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123

   # Optional: Sentry Error Tracking (leave empty to disable)
   NEXT_PUBLIC_SENTRY_DSN=
   SENTRY_AUTH_TOKEN=
   ```

3. **Save the File**
   - Save `.env.local`
   - This file is gitignored and will not be committed to version control

> **Security Note**: Never commit `.env.local` to version control. It contains sensitive API keys.

## Step 6: Deploy Firestore Security Rules

Firestore security rules control who can read/write data. Ambira includes pre-configured rules.

### Install Firebase CLI

1. **Install Firebase Tools**

   ```bash
   npm install -g firebase-tools
   ```

   Or use npx (no global install):

   ```bash
   npx firebase-tools --version
   ```

2. **Verify Installation**
   ```bash
   firebase --version
   # Should output version number (e.g., 13.0.0)
   ```

### Login to Firebase

1. **Authenticate with Firebase**

   ```bash
   npx firebase-tools login
   ```

2. **Follow the Prompts**
   - Your browser will open
   - Sign in with the same Google account you used for Firebase Console
   - Grant permissions
   - Return to terminal

### Initialize Firestore (if not already done)

1. **Initialize Firebase in Project**

   ```bash
   npx firebase-tools init firestore
   ```

2. **Select Project**
   - Choose "Use an existing project"
   - Select your Firebase project from the list

3. **Configure Firestore Files**
   - Accept default for Firestore rules: `firestore.rules`
   - Accept default for Firestore indexes: `firestore.indexes.json`

   > **Note**: These files already exist in the repository

### Deploy Security Rules

1. **Deploy Firestore Rules**

   ```bash
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

2. **Verify Deployment**
   - Command should output: "Deploy complete!"
   - Check Firebase Console > Firestore Database > Rules
   - You should see the deployed rules with a timestamp

3. **Deploy Firestore Indexes** (optional, auto-created on first query)

   ```bash
   npx firebase-tools deploy --only firestore:indexes --non-interactive
   ```

   > **Note**: Composite indexes will auto-create when you first run queries that need them. See [FIREBASE_INDEXES.md](./FIREBASE_INDEXES.md) for details.

## Step 7: Verify Setup

Test that everything is configured correctly.

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Test Authentication

1. **Navigate to App**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

2. **Sign Up**
   - Click "Sign Up" or "Get Started"
   - Create a new account with email/password
   - Or click "Continue with Google"

3. **Verify Success**
   - You should be logged in without errors
   - Check browser console (F12) for any errors
   - Check Firebase Console > Authentication > Users
   - Your new user should appear in the list

### Test Firestore

1. **Create Some Data**
   - Try logging a work session (if timer is available)
   - Or navigate to profile settings and update your profile

2. **Check Firestore Console**
   - Go to Firebase Console > Firestore Database > Data
   - You should see collections created (e.g., `users`, `sessions`)
   - Click into collections to verify data is saved

### Common Success Indicators

- No errors in browser console
- User appears in Firebase Authentication console
- Data appears in Firestore console
- App loads without "Firebase not configured" errors

## Troubleshooting

### "Attempted to access firestore before Firebase was configured"

**Cause**: Environment variables not loaded or incorrect.

**Solution**:

1. Verify `.env.local` exists in project root
2. Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
3. Restart development server: `npm run dev`
4. Clear browser cache and reload

### "Permission denied" errors in Firestore

**Cause**: Security rules not deployed or incorrect.

**Solution**:

1. Deploy rules: `npx firebase-tools deploy --only firestore:rules --non-interactive`
2. Check Firebase Console > Firestore Database > Rules
3. Verify rules updated timestamp is recent
4. Check browser console for specific rule violations

### Google Sign-In doesn't work

**Cause**: Authorized domains not configured or OAuth consent screen incomplete.

**Solution**:

1. Go to Firebase Console > Authentication > Settings
2. Verify `localhost` is in Authorized domains
3. Complete OAuth consent screen in Google Cloud Console
4. Wait 5-10 minutes for changes to propagate

### "Index required" errors

**Cause**: Composite index not created for complex queries.

**Solution**:

1. Check browser console for index creation link
2. Click the link to auto-create the index
3. Or see [FIREBASE_INDEXES.md](./FIREBASE_INDEXES.md) for manual creation
4. Wait 2-5 minutes for index to build

### Can't deploy rules: "Permission denied"

**Cause**: Firebase CLI not authenticated or wrong project selected.

**Solution**:

1. Login again: `npx firebase-tools login --reauth`
2. List projects: `npx firebase-tools projects:list`
3. Select project: `npx firebase-tools use your-project-id`
4. Try deploying again

## Next Steps

After successful Firebase setup:

1. **Review Security Rules**
   - Read `firestore.rules` to understand data access controls
   - See [FIREBASE_INDEXES.md](./FIREBASE_INDEXES.md) for required indexes

2. **Configure Additional Features**
   - Enable Firebase Storage for profile pictures (optional)
   - Set up Firebase Cloud Functions for background tasks (optional)
   - Configure Firebase Hosting for deployment (optional)

3. **Set Up Production Environment**
   - Create separate Firebase project for production
   - Repeat this setup guide for production project
   - Use different `.env.production` file with production credentials

4. **Read Architecture Documentation**
   - [Architecture Overview](../architecture/README.md)
   - [Caching Strategy](../architecture/CACHING_STRATEGY.md)
   - [Testing Guide](../testing/README.md)

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Ambira Architecture Documentation](../architecture/README.md)

## Getting Help

If you encounter issues not covered in this guide:

1. Check browser console for specific error messages
2. Check Firebase Console > Firestore Database > Usage for quota issues
3. Review [Firebase Status Page](https://status.firebase.google.com/)
4. Search [Firebase GitHub Issues](https://github.com/firebase/firebase-js-sdk/issues)
5. Ask in project Slack/Discord (if available)

---

**Last Updated**: November 2024
**Firebase SDK Version**: 10.x
**Next.js Version**: 15.x
