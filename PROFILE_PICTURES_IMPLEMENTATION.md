# Profile Pictures Implementation Guide

This document describes the comprehensive profile picture implementation using Firebase Storage and Firestore.

## Overview

Profile pictures are now fully integrated with Firebase Storage, providing:
- Secure file uploads with validation
- Automatic cleanup of old profile pictures
- Optimized storage rules
- Seamless integration with user profiles

## Architecture

### 1. Firebase Storage Structure

Profile pictures are stored in Firebase Storage with the following path structure:
```
/profile-pictures/{userId}/{fileName}
```

Example:
```
/profile-pictures/abc123xyz/profile_1696234567890.jpg
```

### 2. Storage Rules (`storage.rules`)

The storage rules provide:
- **Authentication**: Only authenticated users can read/write
- **Ownership**: Users can only upload/delete their own profile pictures
- **Validation**: 
  - File size limit: 5MB maximum
  - File types: JPEG, PNG, GIF, WebP only
- **Public Read**: All authenticated users can view profile pictures

Key rules:
```javascript
match /profile-pictures/{userId}/{fileName} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId) && isValidImage();
  allow delete: if isOwner(userId);
}
```

### 3. Firestore Integration

Profile picture URLs are stored in the user document:
```javascript
{
  id: "userId",
  name: "User Name",
  profilePicture: "https://firebasestorage.googleapis.com/...",
  // ... other fields
}
```

## API Methods

### `firebaseUserApi.uploadProfilePicture(file: File): Promise<string>`

Uploads a profile picture to Firebase Storage.

**Parameters:**
- `file`: The image file to upload

**Returns:**
- Download URL of the uploaded image

**Validation:**
- File type must be: JPEG, PNG, GIF, or WebP
- File size must be ≤ 5MB

**Example:**
```typescript
const file = event.target.files[0];
const downloadURL = await firebaseUserApi.uploadProfilePicture(file);
```

### `firebaseUserApi.deleteProfilePicture(profilePictureUrl: string): Promise<void>`

Deletes an old profile picture from Firebase Storage.

**Parameters:**
- `profilePictureUrl`: The full URL of the profile picture to delete

**Notes:**
- Only deletes Firebase Storage URLs (skips external URLs like Google profile photos)
- Fails silently if file doesn't exist
- Non-critical operation (won't throw errors)

### `firebaseUserApi.updateProfile(data): Promise<UserProfile>`

Updates user profile including profile picture URL.

**Parameters:**
```typescript
{
  name?: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
}
```

## Components

### ProfilePicture Component

A reusable component for displaying profile pictures with fallback to initials.

**Usage:**
```tsx
import { ProfilePicture } from '@/components/ProfilePicture';

<ProfilePicture 
  user={user} 
  size="lg" 
  showBorder={true}
/>
```

**Props:**
- `user`: User object with `name` and `profilePicture`
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'md')
- `className`: Additional CSS classes
- `showBorder`: Whether to show border (default: false)

**Features:**
- Automatic fallback to initials if image fails to load
- Gradient background for initials
- Responsive sizing
- Error handling

### EditProfileModal

Updated to support real Firebase Storage uploads.

**Features:**
- File validation (type and size)
- Upload progress indication
- Automatic deletion of old profile pictures
- Toast notifications for user feedback
- Preview of uploaded image

**Upload Flow:**
1. User selects image file
2. Client-side validation (type, size)
3. Upload to Firebase Storage
4. Get download URL
5. Delete old profile picture (if exists)
6. Update form state with new URL
7. Save to Firestore on form submit

## Deployment

### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase project (if not already done):
```bash
firebase init
```

### Deploy Storage Rules

Deploy only storage rules:
```bash
firebase deploy --only storage
```

Deploy all rules (Firestore + Storage):
```bash
firebase deploy --only firestore,storage
```

Deploy everything:
```bash
firebase deploy
```

### Verify Deployment

1. Check Firebase Console:
   - Go to Storage → Rules
   - Verify rules are updated with timestamp

2. Test upload:
   - Login to the app
   - Go to profile settings
   - Upload a profile picture
   - Verify it appears in Storage console

## Security Considerations

### Storage Rules
- ✅ Authentication required for all operations
- ✅ Users can only modify their own pictures
- ✅ File size validation (5MB limit)
- ✅ File type validation (images only)
- ✅ Read access for all authenticated users

### Firestore Rules
- ✅ Profile picture URL field protected in user updates
- ✅ Only owner can update their profilePicture field
- ✅ Validation prevents unauthorized changes

### Client-Side Validation
- ✅ File type checking before upload
- ✅ File size checking before upload
- ✅ Error handling for failed uploads
- ✅ Cleanup of old files

## File Structure

```
ambira-web/
├── storage.rules                          # Firebase Storage security rules
├── firebase.json                          # Firebase config (includes storage)
├── src/
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase initialization
│   │   └── firebaseApi.ts                # API methods (upload/delete)
│   └── components/
│       ├── ProfilePicture.tsx            # Reusable profile picture component
│       ├── EditProfileModal.tsx          # Profile editing with upload
│       └── ProfileHeader.tsx             # Profile display
```

## Testing Checklist

- [ ] Upload new profile picture
- [ ] Verify image appears in Firebase Storage console
- [ ] Verify URL saved to Firestore user document
- [ ] Upload another picture (verify old one is deleted)
- [ ] Test file size validation (try >5MB file)
- [ ] Test file type validation (try non-image file)
- [ ] Test image display on profile page
- [ ] Test fallback to initials when no picture
- [ ] Test error handling (network issues)
- [ ] Verify storage rules in Firebase console

## Troubleshooting

### Upload Fails with Permission Denied
- Check Firebase Storage rules are deployed
- Verify user is authenticated
- Check browser console for detailed error

### Old Pictures Not Deleted
- Check if old URL is Firebase Storage URL
- Verify delete permissions in storage rules
- Check browser console for warnings

### Image Not Displaying
- Verify URL is saved in Firestore
- Check CORS settings in Firebase Storage
- Verify image URL is accessible
- Check browser console for 404 errors

### Storage Rules Not Applied
- Run `firebase deploy --only storage`
- Check Firebase console for deployment status
- Wait a few minutes for propagation
- Clear browser cache

## Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Cost Considerations

Firebase Storage pricing:
- Storage: $0.026/GB/month
- Download: $0.12/GB
- Upload: Free

Typical profile picture (200KB):
- Storage cost: ~$0.000005/month
- Negligible for most applications

## Future Enhancements

Potential improvements:
- [ ] Image compression before upload
- [ ] Multiple image sizes (thumbnails)
- [ ] Crop/resize functionality
- [ ] Progress bar during upload
- [ ] Drag-and-drop upload
- [ ] Camera capture on mobile
- [ ] Image filters/effects
- [ ] CDN integration for faster delivery
