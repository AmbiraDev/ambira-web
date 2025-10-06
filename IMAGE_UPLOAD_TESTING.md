# Image Upload Testing Guide

## What I Fixed

### 1. ✅ Firebase Storage Rules
**Problem**: The `session-images/` path wasn't included in your Storage rules, so uploads were being blocked.

**Solution**: Added a new rule in `storage.rules`:
```javascript
// Session images - allow public read, authenticated write
match /session-images/{userId}/{fileName} {
  // Allow anyone to read (even unauthenticated) for sharing sessions publicly
  allow read: if true;

  // Allow write only to the owner
  allow write: if isOwner(userId) && isValidImage();

  // Allow delete only to the owner
  allow delete: if isOwner(userId);
}
```

The rules have been deployed to Firebase.

### 2. ✅ Image Component Quality Settings
Added `quality={90}` to all Next.js `<Image>` components to match the Next.js config.

### 3. ✅ Enhanced Logging
Added detailed console logging to help debug the upload process:
- File selection
- Upload progress
- Download URL generation
- Any errors

## How to Test Image Upload

### Test 1: Create a New Session with Images

1. **Start a timer** on any project
2. **Pause or finish** the timer
3. In the "Complete Session" screen:
   - Fill in the title (required)
   - Click **"Add images"** under the image upload section
   - Select 1-3 images (max 5MB each)
4. **Look for preview images** - they should appear in a 3-column grid
5. **Click "Save Session"**
6. Watch the browser console for logs:
   ```
   📸 Files selected: 1
   📸 Processing file: image.jpg image/jpeg 1.2MB
   ✅ Added image: image.jpg, preview URL: blob:...
   ✅ Total images now: 1
   📤 Uploading to: session-images/YOUR_USER_ID/timestamp_random.jpg
   ✅ Upload complete. Bytes transferred: 1234567
   🔗 Download URL obtained: https://firebasestorage.googleapis.com/...
   💾 Starting session save...
   📸 Images uploaded: ["https://firebasestorage.googleapis.com/..."]
   ✅ Session saved successfully: SESSION_ID
   ```

### Test 2: Edit an Existing Session

1. Go to **You** tab → **Sessions**
2. Click the **⋮** (three dots) menu on any session
3. Click **"Edit session"**
4. In the edit modal:
   - You should see any existing images
   - Click the **X** on an image to remove it
   - Click **"Add images"** to add new ones
5. **Save changes**

### Test 3: View Images in Feed

1. Go to the **Home** feed
2. Find a session that has images
3. You should see:
   - An image gallery with the first image displayed
   - Dot indicators at the bottom if there are multiple images
   - Arrow navigation buttons (on desktop)
   - Swipe to navigate (on mobile)

## Common Issues & Solutions

### Issue: Preview shows but images don't upload
**Check Console For**: Upload errors or permission denied errors
**Solution**: Make sure you're logged in and the Storage rules are deployed

### Issue: Upload succeeds but images don't show in feed
**Check**:
1. Open browser DevTools → Network tab
2. Filter by "firebasestorage.googleapis.com"
3. Look for failed image requests (red)
4. Click on the failed request to see the error

**Common causes**:
- Storage rules not deployed: Run `npx firebase-tools deploy --only storage`
- Incorrect URL format: Should start with `https://firebasestorage.googleapis.com/`
- CORS issues: Images should load from Firebase CDN

### Issue: Images show as broken
**Check**:
1. Right-click the broken image → "Open in new tab"
2. See what error appears
3. Check if the URL is accessible

**Solution**: If you get a 403 error, the Storage rules aren't allowing read access

### Issue: "Maximum 3 images allowed" even with 0 images
**Solution**: Refresh the page - state might be stale

## Debugging Commands

### View Firebase Storage Files
```bash
npx firebase-tools storage:get session-images/
```

### Check Current Storage Rules
```bash
npx firebase-tools storage:rules:get
```

### Re-deploy Storage Rules
```bash
npx firebase-tools deploy --only storage --non-interactive
```

## Expected Console Output (Success)

When everything works correctly, you should see this sequence:

```
📸 Files selected: 1
📸 Processing file: my-image.jpg image/jpeg 2.45MB
✅ Added image: my-image.jpg, preview URL: blob:http://localhost:3000/abc123
✅ Total images now: 1
💾 Starting session save...
📤 Uploading to: session-images/USER_ID/1234567890_abc123.jpg
✅ Upload complete. Bytes transferred: 2560000
🔗 Download URL obtained: https://firebasestorage.googleapis.com/v0/b/strava-but-productive.appspot...
📸 Images uploaded: ["https://firebasestorage.googleapis.com/..."]
✅ Session saved successfully: SESSION_ID_HERE
```

## Next Steps

1. **Try uploading an image** following Test 1 above
2. **Check the browser console** for the logs
3. **Check the feed** to see if the image displays
4. **Share any error messages** you see in the console

The Storage rules have been deployed and should be working now! 🎉
