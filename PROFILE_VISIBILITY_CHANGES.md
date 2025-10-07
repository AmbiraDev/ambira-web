# Profile Visibility & Suggestions Feature Update

## Summary
Fixed the Connect/Suggestions page to properly show users with public profiles, display follower counts, and ensure new profiles default to "everyone" visibility.

## Changes Made

### 1. Firebase API Updates (`src/lib/firebaseApi.ts`)
- **Updated `getSuggestedUsers` function** (lines 1323-1372):
  - Now filters users by `profileVisibility: 'everyone'`
  - Excludes current user and users already being followed
  - Orders results by follower count (descending)
  - Returns proper `SuggestedUser` objects with follower counts

### 2. UI Component Updates

#### `src/components/SuggestedUsers.tsx`
- **Updated compact view** (lines 204-208):
  - Changed from showing `@username` to showing `{followersCount} followers`
  - Maintains the reason badge below

#### `src/components/RightSidebar.tsx`
- **Simplified suggested users loading** (lines 52-59):
  - Now uses `getSuggestedUsers` API directly instead of manual filtering
  - Automatically respects profile visibility settings
- **Updated display** (lines 136-142):
  - Shows follower count instead of username

### 3. Firestore Index
- **Added composite index** (`firestore.indexes.json` lines 189-202):
  ```json
  {
    "collectionGroup": "users",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "profileVisibility", "order": "ASCENDING" },
      { "fieldPath": "followersCount", "order": "DESCENDING" }
    ]
  }
  ```
- **Deployed to Firestore** ✅

### 4. Default Profile Visibility
- **Already configured correctly** in `firebaseApi.ts`:
  - Line 360: Demo user defaults to `profileVisibility: 'everyone'`
  - Line 411: Email/password signup defaults to `profileVisibility: 'everyone'`
  - Line 485: Google OAuth signup defaults to `profileVisibility: 'everyone'`
  - Line 546: Anonymous user upgrade defaults to `profileVisibility: 'everyone'`

### 5. Firestore Rules
- **Already handle missing profileVisibility** (lines 16-18):
  ```
  allow read: if request.auth != null &&
    (resource.data.profileVisibility == 'everyone' ||
     !('profileVisibility' in resource.data));
  ```

## Migration Script
Created `scripts/migrate-profile-visibility.js` to update any existing users without `profileVisibility` set. This script:
- Scans all users in the database
- Sets `profileVisibility: 'everyone'` for users without it
- Updates in batches of 500 (Firestore limit)
- Requires Firebase Admin SDK service account key

**Note:** This script is optional since the Firestore rules already treat missing `profileVisibility` as `'everyone'`.

## Testing Checklist
- [x] Firestore indexes deployed successfully
- [x] Firestore rules deployed successfully
- [ ] Verify suggested users appear in Connect section
- [ ] Verify follower counts display correctly
- [ ] Verify new user profiles default to "everyone" visibility
- [ ] Verify privacy settings page shows correct default

## Deployment Status
- ✅ Firestore indexes deployed
- ✅ Firestore rules deployed
- ⏳ Application code (pending build/deploy)

## Next Steps
1. Test the changes in development
2. Deploy the application code to production
3. Optionally run the migration script if needed
4. Verify suggested users appear correctly in the UI
