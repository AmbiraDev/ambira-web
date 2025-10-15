  What I Created

  1. scripts/deleteUser.ts - The deletion script

  - Deletes all user data across 12+ collections/subcollections
  - Updates related documents (follower counts, group member counts, etc.)
  - Provides detailed progress output and summary
  - Handles Firebase Auth account deletion

  2. scripts/README.md - Complete documentation

  - Step-by-step setup instructions
  - Usage examples
  - Troubleshooting guide
  - Safety considerations

  Quick Start Instructions

  1. Install ts-node (if needed):

  npm install -D ts-node

  2. Get Firebase Admin SDK Key:

  - Go to https://console.firebase.google.com/
  - Project Settings → Service Accounts
  - Click "Generate New Private Key"
  - Save as serviceAccountKey.json in your project root

  3. Run the script:

  npx ts-node scripts/deleteUser.ts <userId>

  What Gets Deleted

  The script comprehensively removes:
  - User profile & auth account
  - All projects and tasks
  - All sessions
  - All comments and supports
  - Follow relationships (with proper count updates)
  - Streak data
  - Challenge participations
  - Group memberships
  - Notifications
  - Active session data

  The script is production-ready with proper error handling, batched operations, and clear reporting. It also safely
  updates related documents (like decrementing follower counts) to maintain database integrity.
