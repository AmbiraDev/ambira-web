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

## Step 7: Test Firebase Connection

Before starting the app, verify your Firebase configuration is correct.

### Quick Connection Test

1. **Check Environment Variables**

   ```bash
   # Verify .env.local exists
   cat .env.local | grep NEXT_PUBLIC_FIREBASE
   ```

   You should see all Firebase variables with actual values (not placeholders).

2. **Validate Configuration**

   Create a test file `test-firebase-connection.js` in the project root:

   ```javascript
   // test-firebase-connection.js
   require('dotenv').config({ path: '.env.local' })

   const config = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   }

   console.log('Firebase Configuration:')
   console.log('✓ API Key:', config.apiKey ? 'Set' : '❌ Missing')
   console.log('✓ Auth Domain:', config.authDomain || '❌ Missing')
   console.log('✓ Project ID:', config.projectId || '❌ Missing')
   console.log('✓ Storage Bucket:', config.storageBucket || '❌ Missing')
   console.log('✓ Messaging Sender ID:', config.messagingSenderId || '❌ Missing')
   console.log('✓ App ID:', config.appId ? 'Set' : '❌ Missing')

   const allSet = Object.values(config).every((val) => val)
   console.log('\nStatus:', allSet ? '✅ All required variables set' : '❌ Missing variables')
   ```

   Run the test:

   ```bash
   npm install dotenv
   node test-firebase-connection.js
   ```

   Expected output:

   ```
   Firebase Configuration:
   ✓ API Key: Set
   ✓ Auth Domain: your-project.firebaseapp.com
   ✓ Project ID: your-project-id
   ✓ Storage Bucket: your-project.firebasestorage.app
   ✓ Messaging Sender ID: 123456789
   ✓ App ID: Set

   Status: ✅ All required variables set
   ```

3. **Clean up**

   ```bash
   rm test-firebase-connection.js
   ```

## Step 8: Verify Setup

Test that everything works end-to-end.

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

2. **Check Console First**
   - Open browser DevTools (F12 or Right-click > Inspect)
   - Go to Console tab
   - Look for Firebase initialization messages
   - Should NOT see "Firebase not configured" errors

3. **Sign Up with Email/Password**
   - Click "Sign Up" or "Get Started"
   - Enter email: `test@example.com`
   - Enter password: `TestPassword123!`
   - Fill in username and other required fields
   - Click "Sign Up"

4. **Verify Success**
   - You should be redirected to the app (feed or dashboard)
   - No errors in browser console
   - Header shows your profile/username

5. **Check Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Navigate to Authentication > Users
   - Your test user should appear with the email you entered
   - Note the User UID for reference

### Test Google Sign-In

1. **Sign Out**
   - Click your profile in header > Log Out

2. **Sign In with Google**
   - Click "Continue with Google" on login page
   - Select your Google account
   - Grant permissions if prompted

3. **Verify Success**
   - Should be logged in
   - Check Firebase Console > Authentication > Users
   - New user with Google provider should appear

### Test Firestore Database

1. **Create Some Data**
   - Try these actions to create data in Firestore:
     - Update your profile: Go to Settings > My Profile > Update name/bio
     - Log a work session (if timer feature is available)
     - Follow another user (if user discovery is available)

2. **Check Firestore Console**
   - Go to Firebase Console > Firestore Database > Data
   - You should see collections created:
     - `users` - Your user document
     - `sessions` - If you logged a session
     - `follows` - If you followed someone
   - Click into collections to verify data structure

3. **Test Read Permissions**
   - Open a new incognito/private browser window
   - Try to access your profile URL: `http://localhost:3000/profile/yourusername`
   - Should redirect to login (privacy rules working correctly)

### Common Success Indicators

All green means you're ready to develop:

- ✅ No errors in browser console
- ✅ User appears in Firebase Authentication console after signup
- ✅ Data appears in Firestore console after profile updates
- ✅ App loads without "Firebase not configured" errors
- ✅ Can sign in with email/password
- ✅ Can sign in with Google
- ✅ Profile updates persist after page reload

## Firebase Emulators for Local Development (Optional)

Firebase Emulators allow you to develop and test locally without affecting your production Firebase project. This is especially useful for:

- Testing without consuming Firebase quota
- Developing offline
- Running integration tests in CI/CD
- Experimenting with data structures

### Prerequisites

- Firebase CLI installed (from Step 6)
- Java JDK 11+ installed ([download here](https://adoptium.net/))

### Setup Firebase Emulators

1. **Install Emulator Suite**

   ```bash
   npx firebase-tools init emulators
   ```

   Or if already initialized:

   ```bash
   npx firebase-tools setup:emulators:firestore
   npx firebase-tools setup:emulators:auth
   ```

2. **Configure Which Emulators to Use**

   When prompted, select:
   - ✅ Authentication Emulator
   - ✅ Firestore Emulator
   - ⬜ Functions Emulator (optional, not needed for basic development)
   - ⬜ Hosting Emulator (optional)
   - ⬜ Storage Emulator (optional, for profile pictures)

3. **Set Emulator Ports** (or accept defaults)

   Default ports:
   - **Authentication**: 9099
   - **Firestore**: 8080
   - **Emulator UI**: 4000

4. **Create Emulator Config**

   This creates/updates `firebase.json` in your project root:

   ```json
   {
     "firestore": {
       "rules": "firestore.rules",
       "indexes": "firestore.indexes.json"
     },
     "emulators": {
       "auth": {
         "port": 9099
       },
       "firestore": {
         "port": 8080
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```

### Start Emulators

1. **Start the Emulator Suite**

   ```bash
   npx firebase-tools emulators:start
   ```

   You should see output like:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ✔  All emulators ready! It is now safe to connect your app. │
   │ i  View Emulator UI at http://127.0.0.1:4000                │
   └─────────────────────────────────────────────────────────────┘

   ┌────────────────┬────────────────┬─────────────────────────────────┐
   │ Emulator       │ Host:Port      │ View in Emulator UI             │
   ├────────────────┼────────────────┼─────────────────────────────────┤
   │ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
   │ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
   └────────────────┴────────────────┴─────────────────────────────────┘
   ```

2. **Open Emulator UI**

   Navigate to [http://localhost:4000](http://localhost:4000) to see:
   - Firestore data viewer and editor
   - Authentication users list
   - Logs and exports

### Connect App to Emulators

1. **Update Firebase Configuration**

   Modify `src/lib/firebase.ts` to detect and use emulators in development:

   ```typescript
   // Add this after initializing Firebase app
   if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
     // Check if emulators should be used (add to .env.local)
     if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
       const { connectAuthEmulator } = require('firebase/auth')
       const { connectFirestoreEmulator } = require('firebase/firestore')

       connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
         disableWarnings: true,
       })

       connectFirestoreEmulator(db, '127.0.0.1', 8080)

       console.log('🔧 Using Firebase Emulators')
     }
   }
   ```

2. **Add Environment Variable**

   Add to `.env.local`:

   ```bash
   # Set to 'true' to use Firebase Emulators for local development
   # Set to 'false' or comment out to use production Firebase
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

3. **Start Development Server**

   In a new terminal (keep emulators running):

   ```bash
   npm run dev
   ```

4. **Verify Emulator Connection**
   - Open [http://localhost:3000](http://localhost:3000)
   - Check browser console for "🔧 Using Firebase Emulators"
   - Sign up for a new account
   - Check [http://localhost:4000/auth](http://localhost:4000/auth) - user should appear
   - Create some data (update profile)
   - Check [http://localhost:4000/firestore](http://localhost:4000/firestore) - data should appear

### Emulator Data Persistence

By default, emulator data is cleared when you stop the emulators. To persist data:

1. **Export Data**

   ```bash
   npx firebase-tools emulators:export ./firebase-emulator-data
   ```

2. **Import Data on Start**

   ```bash
   npx firebase-tools emulators:start --import ./firebase-emulator-data
   ```

3. **Auto-Export on Exit**

   ```bash
   npx firebase-tools emulators:start --import ./firebase-emulator-data --export-on-exit
   ```

4. **Add to .gitignore**

   ```bash
   echo "firebase-emulator-data/" >> .gitignore
   ```

### Emulator Best Practices

1. **Use for Testing**
   - Run automated tests against emulators
   - No quota consumption
   - Fast test execution

2. **Seed Test Data**
   - Create test users and data
   - Export for consistent test environment
   - Share with team via version control (careful with sensitive data)

3. **Switch Between Emulator and Production**
   - Use `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` to toggle
   - Test against production occasionally to verify parity
   - Never point production builds at emulators

4. **Security Rules Testing**
   - Emulators enforce your `firestore.rules` file
   - Test rule changes before deploying
   - Use Emulator UI Rules Playground for debugging

### Emulator Limitations

- No Cloud Functions triggers (requires Functions emulator)
- No Firebase Extensions
- No Firebase Storage (requires Storage emulator)
- Google Sign-In uses test accounts (not real Google auth)

### Troubleshooting Emulators

**Emulators won't start**

- Check if ports 4000, 8080, 9099 are available
- Close any apps using those ports
- Try different ports in `firebase.json`

**App not connecting to emulators**

- Check `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local`
- Verify emulators are running (`http://localhost:4000` should open)
- Check browser console for connection messages
- Restart development server after starting emulators

**Data not persisting**

- Use `--export-on-exit` flag
- Check export directory exists and is writable
- Don't kill emulators with SIGKILL (use Ctrl+C)

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
