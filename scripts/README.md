# Scripts

## Vercel Deployment

### Initial Setup (One-time)

#### 1. Link Project to Vercel

```bash
vercel link
```

**Prompts you'll see:**
- **Set up and deploy?** → Press Enter (Yes)
- **Which scope?** → Select `hughgramel` (your account) → Press Enter
- **Link to existing project?** → Choose `N` for new project → Press Enter
- **Project name?** → Type `ambira-web` (or your preferred name) → Press Enter
- **In which directory is your code located?** → Press Enter (uses `./`)

**What this does:**
- Creates `.vercel/project.json` with your project ID and org ID
- Links your local repo to a Vercel project
- Sets up deployment configuration

---

#### 2. Push Environment Variables

```bash
./scripts/push-env-to-vercel.sh
```

**What this does:**
- Reads all `NEXT_PUBLIC_*` variables from `.env.local`
- Pushes them to Vercel production environment
- Required for Firebase configuration in production

**Manual alternative** (if you prefer):
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
# ... repeat for each variable
```

---

#### 3. Configure GitHub Integration

In Vercel Dashboard (run `vercel open` to open):
1. Go to **Project Settings** → **Git**
2. Enable **"Require CI checks to pass before deploying"**
3. Set **Production Branch** to `main`
4. Enable **"Auto-deploy on push"** (should be default)

**What this does:**
- Vercel waits for GitHub Actions CI to pass before deploying
- Ensures type-check, lint, and build succeed before production deployment
- Automatically deploys when you push to `main` branch

---

### Deployment Options

#### Option 1: Deploy via Git Push (Recommended)

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**What happens:**
1. GitHub Actions CI runs (type-check, lint, build)
2. If CI passes → Vercel automatically deploys to production
3. If CI fails → Vercel won't deploy (prevents broken code in production)

---

#### Option 2: Manual Deploy via CLI

```bash
# Deploy to production
vercel --prod

# Deploy preview (test before production)
vercel
```

**When to use:**
- Quick hotfixes
- Testing deployments before pushing to Git
- Deploying from a feature branch

---

### Monitoring Deployments

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Open project in browser
vercel open
```

---

### Environment Variables Management

```bash
# View production environment variables
vercel env ls production

# Add a new variable
vercel env add VARIABLE_NAME production

# Remove a variable
vercel env rm VARIABLE_NAME production

# Pull variables to local
vercel env pull .env.production
```

---

### Firestore Rules Deployment

**Important:** Vercel deploys your Next.js app, but Firestore rules need separate deployment:

```bash
# Deploy rules
npx firebase-tools deploy --only firestore:rules --non-interactive
```

**Note:** Always deploy Firestore rules separately when you modify `firestore.rules`. They are NOT deployed by Vercel.

---

### Complete Deployment Flow

```bash
# 1. Test locally
npm run type-check && npm run lint && npm run build

# 2. Commit and push
git add .
git commit -m "feat: your feature"
git push origin main

# 3. Deploy Firestore rules (if modified)
npx firebase-tools deploy --only firestore:rules --non-interactive

# 4. Monitor
vercel logs --follow
```

---

### Troubleshooting

**Deployment fails with "Missing environment variables":**
```bash
./scripts/push-env-to-vercel.sh
```

**Can't find project after linking:**
```bash
cat .vercel/project.json  # Check project link
rm -rf .vercel && vercel link  # Re-link if needed
```

**CI passes but Vercel doesn't deploy:**
- Check Vercel Dashboard → Deployments for errors
- Ensure GitHub integration is enabled in Vercel Dashboard
- Check if manual approval is required (Settings → Git)

---

## Database Scripts

## User Deletion Script

### Overview
The `deleteUser.ts` script safely deletes a user and all their associated data from Firebase. It handles all collections, subcollections, and properly updates related documents.

### What Gets Deleted

The script will delete:
- ✅ User profile document
- ✅ Firebase Authentication account
- ✅ All projects and their tasks
- ✅ All sessions (work sessions)
- ✅ All comments on any sessions
- ✅ All supports (likes) on any sessions
- ✅ All follow relationships (as follower and following)
- ✅ Streak data
- ✅ Challenge participations
- ✅ Group memberships (removes user from groups)
- ✅ All notifications
- ✅ Active session data (timer persistence)

### Prerequisites

1. **Install ts-node** (if not already installed):
   ```bash
   npm install -D ts-node
   ```

2. **Get Firebase Admin SDK Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the root directory of this project

3. **Security**: Add `serviceAccountKey.json` to `.gitignore` (it should already be there):
   ```bash
   echo "serviceAccountKey.json" >> .gitignore
   ```

### Usage

#### Basic Usage
```bash
npx ts-node scripts/deleteUser.ts <userId>
```

#### Example
```bash
npx ts-node scripts/deleteUser.ts abc123xyz456
```

### How to Find a User ID

There are several ways to get a user's ID:

1. **From Firebase Console**:
   - Go to Firestore Database
   - Navigate to the `users` collection
   - Find the user by their username or email
   - The document ID is the user ID

2. **From the Application**:
   - Log in as the user
   - Open browser DevTools → Console
   - Run: `firebase.auth().currentUser.uid`

3. **Using Firebase Auth Console**:
   - Go to Authentication → Users
   - Find the user by email
   - The UID column shows the user ID

### Sample Output

```
🚀 Starting deletion process for user: abc123xyz456

📋 User found: johndoe (abc123xyz456)
   Followers: 25
   Following: 42

⚠️  This will permanently delete:
   - User profile
   - All projects and tasks
   ...

🔄 Deleting active session...
   ✅ Deleted 1 active session records

🔄 Deleting projects and tasks...
   ✅ Deleted 5 projects and 23 tasks

...

✅ DELETION COMPLETE

📊 Summary:
   User Document: ✅
   Auth Account: ✅
   Projects: 5
   Tasks: 23
   Sessions: 142
   Comments: 37
   Supports: 89
   Follows: 67
   Streaks: 1
   Challenge Participations: 3
   Group Memberships: 2
   Notifications: 54
   Active Session Records: 1
```

### Safety Features

- **Verification**: The script verifies the user exists before proceeding
- **Comprehensive**: Handles all related data and updates counts properly
- **Atomic Operations**: Uses batched writes where possible for consistency
- **Clear Reporting**: Shows exactly what was deleted with a summary

### Important Notes

⚠️ **This operation is irreversible!** Once a user is deleted, their data cannot be recovered.

⚠️ **Follower/Following Counts**: The script automatically decrements follower and following counts on related users.

⚠️ **Group Counts**: The script automatically decrements member counts in groups the user was part of.

⚠️ **Session Visibility**: Sessions created by the user are deleted, so they will no longer appear in feeds.

### Troubleshooting

**Error: "Cannot find module 'serviceAccountKey.json'"**
- Make sure you've downloaded and saved the service account key file in the project root

**Error: "User with ID X does not exist"**
- Double-check the user ID
- Verify you're using the correct Firebase project

**Error: "Insufficient permissions"**
- Ensure the service account has appropriate permissions
- The service account should have "Firebase Admin SDK Administrator Service Agent" role

**TypeScript errors**
- Make sure all dependencies are installed: `npm install`
- If you still get errors, try: `npm install -D @types/node`

### Testing the Script

Before running on a production database, consider:

1. **Test on a development database** with a test user
2. **Create a backup** of your Firestore data
3. **Verify the user ID** is correct before running

### Additional Considerations

If you need to:
- **Export user data before deletion**: Create a separate script to export data first
- **Soft delete instead of hard delete**: Modify the script to set a `deleted: true` flag instead
- **Transfer ownership**: Reassign projects/sessions to another user before deletion
