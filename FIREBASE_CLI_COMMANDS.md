# Firebase CLI Commands - Quick Reference

## Profile Pictures Deployment

### Prerequisites
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify current project
firebase use
```

### Deployment Commands

#### Deploy Storage Rules Only
```bash
firebase deploy --only storage
```

#### Deploy Firestore + Storage Rules
```bash
firebase deploy --only firestore,storage
```

#### Deploy Everything
```bash
firebase deploy
```

#### Dry Run (Test without deploying)
```bash
firebase deploy --only storage --dry-run
```

### Verification Commands

#### Check Current Project
```bash
firebase projects:list
firebase use
```

#### View Storage Rules
```bash
# In Firebase Console
https://console.firebase.google.com/project/strava-but-productive/storage/rules
```

#### Test Rules Locally (Emulator)
```bash
firebase emulators:start --only storage
```

### Troubleshooting Commands

#### Check Firebase CLI Version
```bash
firebase --version
```

#### Debug Deployment
```bash
firebase deploy --only storage --debug
```

#### View Deployment History
```bash
firebase deploy:history
```

#### Rollback to Previous Version
```bash
firebase deploy:rollback storage
```

### Project Management

#### List All Projects
```bash
firebase projects:list
```

#### Switch Project
```bash
firebase use strava-but-productive
```

#### Add Project Alias
```bash
firebase use --add
```

### Storage Management

#### View Storage Usage
```bash
# Via Firebase Console
https://console.firebase.google.com/project/strava-but-productive/storage
```

#### Download Storage Rules
```bash
firebase storage:rules:get > current-storage.rules
```

#### Test Rules
```bash
firebase storage:rules:test
```

## Common Workflows

### Initial Setup
```bash
# 1. Login
firebase login

# 2. Select project
firebase use strava-but-productive

# 3. Deploy storage rules
firebase deploy --only storage
```

### Update Rules
```bash
# 1. Edit storage.rules file
# 2. Test locally (optional)
firebase emulators:start --only storage

# 3. Deploy
firebase deploy --only storage
```

### Verify Deployment
```bash
# 1. Check deployment
firebase deploy --only storage

# 2. Verify in console
# Visit: https://console.firebase.google.com/project/strava-but-productive/storage/rules

# 3. Test upload in app
npm run dev
```

## Error Resolution

### "Firebase Storage has not been set up"
```bash
# Solution: Enable Storage in Firebase Console
# Visit: https://console.firebase.google.com/project/strava-but-productive/storage
# Click: "Get Started"
```

### "Permission denied"
```bash
# Check authentication
firebase login

# Verify project access
firebase projects:list

# Re-deploy rules
firebase deploy --only storage --force
```

### "Rules compilation error"
```bash
# Check syntax
firebase deploy --only storage --dry-run

# View detailed errors
firebase deploy --only storage --debug
```

## Environment Setup

### Required Environment Variables
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=strava-but-productive.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=strava-but-productive
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=strava-but-productive.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Deployment Checklist

- [ ] Firebase CLI installed
- [ ] Logged in to Firebase
- [ ] Correct project selected
- [ ] Storage enabled in Console
- [ ] Environment variables set
- [ ] storage.rules file created
- [ ] firebase.json updated
- [ ] Rules deployed successfully
- [ ] Tested in development
- [ ] Verified in Firebase Console

## Quick Commands Summary

| Task | Command |
|------|---------|
| Deploy storage rules | `firebase deploy --only storage` |
| Deploy all rules | `firebase deploy --only firestore,storage` |
| Test before deploy | `firebase deploy --only storage --dry-run` |
| Check project | `firebase use` |
| View projects | `firebase projects:list` |
| Debug deployment | `firebase deploy --only storage --debug` |
| Start emulator | `firebase emulators:start --only storage` |
| View history | `firebase deploy:history` |

## Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Storage Rules Reference](https://firebase.google.com/docs/storage/security)
- [Firebase Console](https://console.firebase.google.com)
- [Emulator Suite](https://firebase.google.com/docs/emulator-suite)
