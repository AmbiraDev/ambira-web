# Firebase Storage Setup Guide

## Initial Setup Required

Firebase Storage needs to be initialized in the Firebase Console before deploying rules.

### Step 1: Enable Firebase Storage

1. Go to the Firebase Console:
   ```
   https://console.firebase.google.com/project/strava-but-productive/storage
   ```

2. Click **"Get Started"** button

3. Review the security rules dialog and click **"Next"**

4. Select your Cloud Storage location (choose closest to your users):
   - `us-central1` (Iowa) - Default
   - `us-east1` (South Carolina)
   - `us-west1` (Oregon)
   - `europe-west1` (Belgium)
   - `asia-east1` (Taiwan)
   - etc.

5. Click **"Done"**

### Step 2: Verify Storage Bucket

After initialization, verify your storage bucket name in Firebase Console:
- Should be: `strava-but-productive.appspot.com`

Update your `.env.local` if needed:
```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=strava-but-productive.appspot.com
```

### Step 3: Deploy Storage Rules

Once Storage is enabled, deploy the rules:

```bash
firebase deploy --only storage
```

Expected output:
```
=== Deploying to 'strava-but-productive'...

i  deploying storage
i  storage: checking storage.rules for compilation errors...
✔  storage: rules file storage.rules compiled successfully
i  storage: uploading rules storage.rules...
✔  storage: released rules storage.rules to firebase.storage/strava-but-productive.appspot.com

✔  Deploy complete!
```

### Step 4: Verify Rules Deployment

1. Go to Firebase Console → Storage → Rules
2. Verify the rules match `storage.rules` file
3. Check the "Last updated" timestamp

### Step 5: Test Upload

1. Run your Next.js app:
   ```bash
   npm run dev
   ```

2. Login to the app

3. Navigate to profile settings

4. Upload a profile picture

5. Verify in Firebase Console:
   - Go to Storage → Files
   - Check for `/profile-pictures/{userId}/` folder
   - Verify image is uploaded

## Troubleshooting

### Error: "Firebase Storage has not been set up"
**Solution:** Complete Step 1 above to enable Storage in Firebase Console

### Error: "Permission denied"
**Solution:** 
- Verify storage rules are deployed
- Check user is authenticated
- Verify storage bucket name in `.env.local`

### Error: "Storage bucket not found"
**Solution:**
- Check `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local`
- Verify bucket name matches Firebase Console

### Upload succeeds but file not visible
**Solution:**
- Refresh Firebase Console
- Check correct project is selected
- Verify file path: `/profile-pictures/{userId}/`

## Security Notes

After enabling Storage, the default rules are:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Our custom rules (`storage.rules`) are more restrictive:
- Users can only upload to their own folder
- File size limited to 5MB
- Only image files allowed
- Automatic validation

## Quick Start Commands

```bash
# 1. Enable Storage in Firebase Console (manual step)
# Visit: https://console.firebase.google.com/project/strava-but-productive/storage

# 2. Deploy storage rules
firebase deploy --only storage

# 3. Verify deployment
firebase deploy --only storage --dry-run

# 4. Test in development
npm run dev
```

## Next Steps

After successful setup:
1. ✅ Storage enabled in Firebase Console
2. ✅ Rules deployed via Firebase CLI
3. ✅ Environment variables configured
4. ✅ Test profile picture upload
5. ✅ Verify files in Storage console

## Additional Resources

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
