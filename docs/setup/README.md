# Setup Documentation

Complete guides for setting up your Ambira development environment.

## Getting Started

If you're new to Ambira development, follow these guides in order:

### 1. Firebase Setup (Required)

**[Firebase Setup Guide](./FIREBASE_SETUP.md)** - Complete walkthrough for configuring Firebase

This guide covers:

- Creating a Firebase project
- Enabling Authentication (Email/Password and Google)
- Setting up Firestore Database
- Configuring environment variables
- Deploying security rules
- Verifying your setup

**Estimated time**: 15-20 minutes

### 2. Firebase Indexes (As Needed)

**[Firebase Indexes Guide](./FIREBASE_INDEXES.md)** - Understanding and creating Firestore indexes

This guide covers:

- What composite indexes are and why they're needed
- Complete list of required indexes
- Auto-creation vs manual creation
- Troubleshooting index issues
- Performance best practices

**Estimated time**: 5 minutes (indexes auto-create as you use the app)

## Quick Reference

### Environment Variables

Copy the example file and fill in your Firebase configuration:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Optional variables:

- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (Google Analytics)
- `NEXT_PUBLIC_SENTRY_DSN` (Error tracking)
- `SENTRY_AUTH_TOKEN` (Production deployments)

### Firebase CLI Commands

Login to Firebase:

```bash
npx firebase-tools login
```

Initialize Firestore:

```bash
npx firebase-tools init firestore
```

Deploy security rules:

```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
```

Deploy indexes:

```bash
npx firebase-tools deploy --only firestore:indexes --non-interactive
```

### Common Issues

**"Attempted to access firestore before Firebase was configured"**

- Verify `.env.local` exists and contains all required variables
- Restart development server: `npm run dev`
- Clear browser cache and reload

**"Permission denied" in Firestore**

- Deploy security rules: `npx firebase-tools deploy --only firestore:rules --non-interactive`
- Check Firebase Console > Firestore Database > Rules for recent update timestamp

**"Index required" error**

- Click the link in the browser console to auto-create the index
- Or see [FIREBASE_INDEXES.md](./FIREBASE_INDEXES.md) for manual creation

## Additional Setup

### Testing Setup

See [Testing Quickstart](../testing/QUICKSTART.md) for setting up the test environment.

### Development Tools

Recommended VS Code extensions:

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Firebase
- GitLens

Configure your editor to format on save for consistent code style.

## Next Steps

After completing setup:

1. **Read Architecture Documentation**
   - [Architecture Overview](../architecture/README.md)
   - [Caching Strategy](../architecture/CACHING_STRATEGY.md)

2. **Review Development Guidelines**
   - [CLAUDE.md](../../CLAUDE.md) - AI assistant and project guidelines
   - [README.md](../../README.md) - Project overview

3. **Start Developing**
   - Run `npm run dev` to start the development server
   - Navigate to `http://localhost:3000`
   - Try signing up and creating your first session

## Getting Help

If you encounter issues:

1. Check the troubleshooting sections in each guide
2. Search existing GitHub issues
3. Ask in project Slack/Discord (if available)
4. Create a new issue with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Browser console output
   - Firebase Console screenshots (if relevant)

## Contributing to Setup Docs

When updating these guides:

1. Keep instructions clear and step-by-step
2. Include troubleshooting for common errors
3. Add screenshots for complex UI interactions
4. Test instructions on a fresh Firebase project
5. Update estimated completion times
6. Keep quick reference commands current

---

**Last Updated**: November 2024
