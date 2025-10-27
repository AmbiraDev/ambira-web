# Operations Scripts

Destructive operation scripts for Firebase and deployment management.

**WARNING**: These scripts may permanently delete or modify data. Always use `--dry-run` first to preview changes.

## Scripts in This Directory

### deleteUser.ts
Safely delete a user and all their associated data from Firebase.

```bash
# Preview what would be deleted
npx ts-node scripts/ops/deleteUser.ts <userId> --dry-run

# Actually delete the user
npx ts-node scripts/ops/deleteUser.ts <userId>
```

**Required**: Firebase service account key (`serviceAccountKey.json`)

### migrate-profile-visibility.js
Update profile visibility settings for users who don't have them set.

```bash
# Preview what would be updated
node scripts/ops/migrate-profile-visibility.js --dry-run

# Execute the migration
node scripts/ops/migrate-profile-visibility.js

# Show help
node scripts/ops/migrate-profile-visibility.js --help
```

**Required**: Firebase service account key (`serviceAccountKey.json`)

### push-env-to-vercel.sh
Push environment variables from `.env.local` to Vercel production.

```bash
./scripts/ops/push-env-to-vercel.sh
```

**Required**: Vercel CLI authenticated and project linked

---

## Safety Guidelines

1. **Always use `--dry-run` first** to preview changes
2. **Verify your target** (user IDs, environment variables, etc.)
3. **Have a backup** of your Firestore data before major operations
4. **Test in development** before running in production
5. **Document changes** for auditing purposes

---

## Firebase Setup

All Firebase scripts require a service account key:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root
4. Add to `.gitignore` (should already be there)

For detailed documentation, see [../README.md](../README.md)
