# Scripts

This directory contains utility scripts organized by purpose. Scripts are organized into two main categories:

- **dev/** - Development and scaffolding tools
- **ops/** - Operations and data management scripts (often destructive)

---

## Directory Structure

```
scripts/
├── README.md (this file)
├── dev/
│   ├── create-feature.js          # Scaffold new feature folders
│   ├── finish-activity-refactor.sh # Automation helper for refactoring
│   ├── cls-profiler.js            # Performance profiling tool
│   └── cls-profile-report.json    # Output from cls-profiler
└── ops/
    ├── deleteUser.ts              # Delete user and all associated data
    ├── migrate-profile-visibility.js # Update user profile visibility settings
    └── push-env-to-vercel.sh       # Push environment variables to Vercel
```

---

## Development Scripts (scripts/dev/)

Development scripts are safe to run and used for scaffolding and automation tasks.

### create-feature.js

Scaffolds a new feature with the standardized React Query pattern.

**Usage:**
```bash
npm run create-feature <feature-name>
npm run create-feature sessions
```

**Creates:**
```
src/features/<feature>/
  ├── services/<Feature>Service.ts
  ├── hooks/use<Feature>.ts
  ├── hooks/use<Feature>Mutations.ts
  ├── hooks/index.ts
  └── types/<feature>.types.ts (optional)
```

**Requirements:**
- No special permissions needed
- Node.js 16+ required

---

### finish-activity-refactor.sh

Automation script to complete the projects -> activities refactor.

**Usage:**
```bash
bash scripts/dev/finish-activity-refactor.sh
```

**What it does:**
1. Updates text labels from "Project" to "Activity"
2. Updates variable names in SessionTimerEnhanced.tsx
3. Creates /activities route from /projects
4. Provides next steps for manual completion

**Requirements:**
- Bash shell
- sed command
- No special permissions needed

---

### cls-profiler.js

Performance profiling tool for analyzing Cumulative Layout Shift (CLS) metrics.

**Usage:**
```bash
npm run profile:cls
```

**Output:**
- Performance metrics
- JSON report saved to `scripts/dev/cls-profile-report.json`

**Requirements:**
- No special permissions needed
- Generates performance data for optimization analysis

---

## Operations Scripts (scripts/ops/)

**IMPORTANT**: Operations scripts interact with Firebase and Vercel. They may be destructive, so always test with `--dry-run` first.

All ops scripts support a `--dry-run` flag to preview changes without modifying data.

---

### deleteUser.ts

Safely deletes a user and all their associated data from Firebase.

**Firebase IAM Roles Required:**
- `roles/firebase.admin` (primary option)
- OR `roles/firebasedatabase.admin` + `roles/datastore.owner`

**Service Account Permissions Required:**
- `firebase.auth.users.delete`
- `datastore.databases.update`
- `datastore.databases.get`
- `datastore.entities.delete`
- `datastore.entities.get`
- `datastore.entities.update`

**Verify Service Account Access:**
```bash
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:serviceAccount:YOUR_SA@PROJECT_ID.iam.gserviceaccount.com"
```

**Usage:**
```bash
# Preview what would be deleted (recommended first step)
npx ts-node scripts/ops/deleteUser.ts <userId> --dry-run

# Actually delete the user
npx ts-node scripts/ops/deleteUser.ts <userId>
```

**Example:**
```bash
npx ts-node scripts/ops/deleteUser.ts abc123xyz --dry-run
npx ts-node scripts/ops/deleteUser.ts abc123xyz
```

**Prerequisites:**
1. Firebase Admin SDK service account key:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in project root

2. Install ts-node (if not already installed):
   ```bash
   npm install -D ts-node
   ```

3. Add `serviceAccountKey.json` to `.gitignore` (should already be there)

**What Gets Deleted:**
- User profile document
- Firebase Authentication account
- All projects and their tasks
- All sessions (work sessions)
- All comments on any sessions
- All supports (likes) on any sessions
- All follow relationships (as follower and following)
- Streak data
- Challenge participations
- Group memberships (removes user from groups)
- All notifications
- Active session data (timer persistence)

**Safety Features:**
- Verification: Script verifies user exists before proceeding
- Comprehensive: Handles all related data and updates counts properly
- Atomic Operations: Uses batched writes for consistency
- Clear Reporting: Shows exactly what was deleted with a summary
- Dry Run: Preview mode shows all changes without making them

**Dry Run Output Example:**
```
[DRY RUN] Starting deletion process for user: abc123xyz

[DRY RUN] User found: johndoe (abc123xyz)
   Followers: 25
   Following: 42

DRY RUN MODE - No changes will be made

[DRY RUN] This will permanently delete:
   ...

[DRY RUN] Deleting active session...
   Would delete 1 active session records

[DRY RUN] Deleting projects and tasks...
   Would delete 5 projects and 23 tasks

...

✅ DRY RUN COMPLETE

📊 Summary:
   User Document: ✅
   Auth Account: ✅
   Projects: 5
   ...

To execute this deletion, run without the --dry-run flag.
```

**Important Notes:**
- This operation is irreversible! Once deleted, data cannot be recovered.
- Follower/Following Counts: Script automatically decrements counts on related users
- Group Counts: Script automatically decrements member counts in groups
- Session Visibility: Sessions created by user are deleted and removed from feeds

---

### migrate-profile-visibility.js

Updates profile visibility settings for users who don't have them set.

**Firebase IAM Roles Required:**
- `roles/datastore.owner` (primary option)
- OR `roles/firebase.admin`

**Service Account Permissions Required:**
- `datastore.databases.update`
- `datastore.databases.get`
- `datastore.entities.get`
- `datastore.entities.update`

**Verify Service Account Access:**
```bash
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:serviceAccount:YOUR_SA@PROJECT_ID.iam.gserviceaccount.com"
```

**Usage:**
```bash
# Preview what would be updated (recommended first step)
node scripts/ops/migrate-profile-visibility.js --dry-run

# Execute the migration
node scripts/ops/migrate-profile-visibility.js

# Show help
node scripts/ops/migrate-profile-visibility.js --help
```

**Prerequisites:**
1. Firebase Admin SDK service account key:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in project root

2. Add `serviceAccountKey.json` to `.gitignore` (should already be there)

**What Gets Updated:**
For each user without `profileVisibility` set:
- Sets `profileVisibility: 'everyone'`
- Sets `activityVisibility` to existing value or 'everyone'
- Sets `projectVisibility` to existing value or 'everyone'
- Updates `updatedAt` timestamp

**Dry Run Output Example:**
```
[DRY RUN] Starting profile visibility migration...

DRY RUN MODE - No changes will be made

Users that would be updated: 42

First 10 users to be updated (showing sample):
  - alice_smith (user123)
    Current: profileVisibility=not set, activityVisibility=not set, projectVisibility=not set
    Proposed: profileVisibility=everyone, activityVisibility=everyone, projectVisibility=everyone
  - bob_jones (user456)
    Current: profileVisibility=not set, activityVisibility=followers, projectVisibility=not set
    Proposed: profileVisibility=everyone, activityVisibility=followers, projectVisibility=everyone
  ...and 8 more

✅ DRY RUN complete!
Total users: 100
Would update: 42
Already set: 58

To execute this migration, run without the --dry-run flag.
```

---

### push-env-to-vercel.sh

Pushes environment variables from `.env.local` to Vercel production environment.

**Vercel Permissions Required:**
- Vercel CLI must be authenticated: `vercel login`
- You must be a member of the Vercel project
- Project must be linked via `.vercel/project.json` (created with: `vercel link`)

**Verify Vercel Access:**
```bash
vercel env ls production
```

**Usage:**
```bash
./scripts/ops/push-env-to-vercel.sh
```

**Prerequisites:**
1. Vercel CLI installed globally:
   ```bash
   npm install -g vercel
   ```

2. Authenticate with Vercel:
   ```bash
   vercel login
   ```

3. Link project to Vercel:
   ```bash
   vercel link
   ```

4. Create `.env.local` with your environment variables:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
   # ... other variables
   ```

**What Gets Pushed:**
- All `NEXT_PUBLIC_*` variables from `.env.local`
- Variables are pushed to production environment
- Existing variables are overwritten

**Output Example:**
```
🚀 Pushing environment variables to Vercel...

📤 Pushing: NEXT_PUBLIC_FIREBASE_API_KEY
📤 Pushing: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
📤 Pushing: NEXT_PUBLIC_FIREBASE_PROJECT_ID
📤 Pushing: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
📤 Pushing: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
📤 Pushing: NEXT_PUBLIC_FIREBASE_APP_ID

✅ All environment variables pushed to Vercel production!

Next steps:
1. Run 'vercel --prod' to deploy to production
2. Or push to GitHub 'main' branch for automatic deployment
```

---

## Firebase Configuration and Permissions

### Setting Up Firebase Service Account

For ops scripts that interact with Firebase, you need a service account key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json` in the project root
6. Add to `.gitignore` (should already be included):
   ```bash
   echo "serviceAccountKey.json" >> .gitignore
   ```

### IAM Roles Explained

**roles/firebase.admin**
- Full access to all Firebase services
- Use when you need complete Firebase control
- Recommended for development/testing environments

**roles/datastore.owner**
- Full access to Firestore
- Includes read, write, and delete permissions
- Use when you only need Firestore access

**roles/firebasedatabase.admin**
- Full access to Realtime Database
- Add to your service account if using Realtime Database

---

## Safety Guidelines for Operations Scripts

1. **Always Test with --dry-run First**
   ```bash
   npx ts-node scripts/ops/deleteUser.ts <userId> --dry-run
   node scripts/ops/migrate-profile-visibility.js --dry-run
   ```

2. **Verify Your Target**
   - Double-check usernames and IDs before executing
   - For migrations, review the sample output

3. **Have a Backup**
   - Create a backup of your Firestore data before major operations
   - Use Firebase Console → Firestore → Exports to create backup

4. **Check Timestamps**
   - Verify you're using the correct Firebase project
   - Check that your service account is configured for the right project

5. **Log Changes**
   - Review the summary output
   - Keep logs of any major operations for auditing

---

## Environment Variables Reference

### Firebase Configuration
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `NEXT_PUBLIC_MEASUREMENT_ID` | No | Google Analytics measurement ID |

### Service Account Setup
- `serviceAccountKey.json` (file in project root, NOT in git)
- Obtain from Firebase Console → Project Settings → Service Accounts
- Add to `.gitignore`

---

## Troubleshooting

### "serviceAccountKey.json not found"
- Download from Firebase Console → Project Settings → Service Accounts
- Save in project root directory
- Verify file path matches script requirements

### "Insufficient permissions" Error
- Check IAM roles assigned to service account
- Run verification command to list roles
- May need to request additional permissions from project admin

### "User with ID X does not exist"
- Double-check the user ID
- Verify you're using the correct Firebase project
- Check Firebase Console → Authentication to find correct UID

### "Cannot connect to Vercel"
- Run `vercel login` to authenticate
- Run `vercel link` to link project
- Check `.vercel/project.json` exists with correct project ID

### Script hangs or times out
- Large migrations may take time
- Check your internet connection
- Ensure service account has sufficient permissions
- Try running on a smaller dataset first (use --dry-run to see scale)

---

## Command Reference

### Development Scripts
```bash
npm run create-feature <name>    # Scaffold new feature
bash scripts/dev/finish-activity-refactor.sh  # Complete refactor
npm run profile:cls              # Run performance profiler
```

### Operations Scripts
```bash
# User Deletion
npx ts-node scripts/ops/deleteUser.ts <userId> --dry-run
npx ts-node scripts/ops/deleteUser.ts <userId>

# Profile Visibility Migration
node scripts/ops/migrate-profile-visibility.js --dry-run
node scripts/ops/migrate-profile-visibility.js

# Vercel Environment Variables
./scripts/ops/push-env-to-vercel.sh
```

---

## Best Practices

1. **Always Preview First**: Use `--dry-run` before executing destructive operations
2. **Test in Development**: Run against development Firebase project first
3. **Document Changes**: Keep records of what was changed and why
4. **Version Control**: Commit relevant changes before running ops scripts
5. **Team Communication**: Notify team before major data operations
6. **Monitor Afterwards**: Check logs and verify results after execution

---

## Related Documentation

- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

## Contributing

When adding new scripts:

1. Place in appropriate directory (dev/ or ops/)
2. Add comprehensive header comments with usage
3. Document Firebase/Vercel permissions if applicable
4. Support `--dry-run` for destructive operations
5. Add help text with examples
6. Update this README with full documentation
