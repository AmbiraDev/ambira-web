/**
 * User Deletion Script
 *
 * This script safely deletes a user and all their associated data from Firebase.
 * It handles all collections, subcollections, and references.
 *
 * REQUIRED FIREBASE IAM ROLES:
 * - roles/firebase.admin (or equivalent with these permissions)
 * - roles/firebasedatabase.admin (for Realtime Database, if applicable)
 * - roles/datastore.owner (for Firestore access)
 *
 * REQUIRED SERVICE ACCOUNT PERMISSIONS:
 * - firebase.auth.users.delete
 * - datastore.databases.update
 * - datastore.databases.get
 * - datastore.entities.delete
 * - datastore.entities.get
 * - datastore.entities.update
 *
 * VERIFICATION:
 * To verify your service account has required permissions, run:
 *   gcloud projects get-iam-policy PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:serviceAccount:YOUR_SA@PROJECT_ID.iam.gserviceaccount.com"
 *
 * Usage:
 *   npx ts-node scripts/ops/deleteUser.ts <userId> [--dry-run]
 *
 * Examples:
 *   npx ts-node scripts/ops/deleteUser.ts abc123xyz
 *   npx ts-node scripts/ops/deleteUser.ts abc123xyz --dry-run
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

// Initialize Firebase Admin
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Dynamic path resolution requires CommonJS require() for service account JSON
const serviceAccount = require(
  path.join(__dirname, '../serviceAccountKey.json')
) as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

interface DeletionStats {
  user: boolean;
  auth: boolean;
  projects: number;
  tasks: number;
  sessions: number;
  comments: number;
  supports: number;
  follows: number;
  streaks: number;
  challengeParticipants: number;
  groupMembers: number;
  notifications: number;
  activeSession: number;
}

interface DeletionOptions {
  dryRun: boolean;
}

async function deleteUser(
  userId: string,
  options: DeletionOptions
): Promise<void> {
  const dryRunPrefix = options.dryRun ? '[DRY RUN] ' : '';
  console.log(
    `${dryRunPrefix}🚀 Starting deletion process for user: ${userId}\n`
  );

  const stats: DeletionStats = {
    user: false,
    auth: false,
    projects: 0,
    tasks: 0,
    sessions: 0,
    comments: 0,
    supports: 0,
    follows: 0,
    streaks: 0,
    challengeParticipants: 0,
    groupMembers: 0,
    notifications: 0,
    activeSession: 0,
  };

  try {
    // Get user document first to verify existence and get username
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User with ID ${userId} does not exist`);
    }

    const userData = userDoc.data();
    const username = userData?.username || 'unknown';
    console.log(`${dryRunPrefix}📋 User found: ${username} (${userId})`);
    console.log(`   Followers: ${userData?.followerCount || 0}`);
    console.log(`   Following: ${userData?.followingCount || 0}\n`);

    // Show dry run mode notice
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Confirm deletion
    console.log(`${dryRunPrefix}⚠️  This will permanently delete:`);
    console.log('   - User profile');
    console.log('   - All projects and tasks');
    console.log('   - All sessions');
    console.log('   - All comments');
    console.log('   - All supports (likes)');
    console.log('   - All follow relationships');
    console.log('   - Streak data');
    console.log('   - Challenge participations');
    console.log('   - Group memberships');
    console.log('   - Notifications');
    console.log('   - Firebase Authentication account\n');

    // In a real scenario, you'd want a confirmation prompt here
    // For this script, we'll proceed automatically

    // 1. Delete active session subcollection
    console.log(`${dryRunPrefix}🔄 Deleting active session...`);
    const activeSessionSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('activeSession')
      .get();

    stats.activeSession = activeSessionSnapshot.docs.length;
    if (!options.dryRun) {
      const activeSessionBatch = db.batch();
      activeSessionSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          activeSessionBatch.delete(doc.ref);
        }
      );
      await activeSessionBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.activeSession} active session records\n`
    );

    // 2. Delete all projects and their tasks
    console.log(`${dryRunPrefix}🔄 Deleting projects and tasks...`);
    const projectsSnapshot = await db
      .collection('projects')
      .doc(userId)
      .collection('userProjects')
      .get();

    for (const projectDoc of projectsSnapshot.docs) {
      // Count tasks for this project
      const tasksSnapshot = await projectDoc.ref.collection('tasks').get();
      stats.tasks += tasksSnapshot.docs.length;

      if (!options.dryRun) {
        const taskBatch = db.batch();
        tasksSnapshot.docs.forEach(
          (taskDoc: QueryDocumentSnapshot<DocumentData>) => {
            taskBatch.delete(taskDoc.ref);
          }
        );
        await taskBatch.commit();

        // Delete project
        await projectDoc.ref.delete();
      }
      stats.projects++;
    }

    if (!options.dryRun) {
      // Delete the projects document
      await db.collection('projects').doc(userId).delete();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.projects} projects and ${stats.tasks} tasks\n`
    );

    // 3. Delete all sessions created by this user
    console.log(`${dryRunPrefix}🔄 Deleting sessions...`);
    const sessionsSnapshot = await db
      .collection('sessions')
      .where('userId', '==', userId)
      .get();

    stats.sessions = sessionsSnapshot.docs.length;
    if (!options.dryRun) {
      const sessionBatch = db.batch();
      sessionsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          sessionBatch.delete(doc.ref);
        }
      );
      await sessionBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.sessions} sessions\n`
    );

    // 4. Delete all comments by this user
    console.log(`${dryRunPrefix}🔄 Deleting comments...`);
    const commentsSnapshot = await db
      .collection('comments')
      .where('userId', '==', userId)
      .get();

    stats.comments = commentsSnapshot.docs.length;
    if (!options.dryRun) {
      const commentBatch = db.batch();
      commentsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          commentBatch.delete(doc.ref);
        }
      );
      await commentBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.comments} comments\n`
    );

    // 5. Delete all supports (likes) by this user
    console.log(`${dryRunPrefix}🔄 Deleting supports...`);
    const supportsSnapshot = await db
      .collection('supports')
      .where('userId', '==', userId)
      .get();

    stats.supports = supportsSnapshot.docs.length;
    if (!options.dryRun) {
      const supportBatch = db.batch();
      supportsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          supportBatch.delete(doc.ref);
        }
      );
      await supportBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.supports} supports\n`
    );

    // 6. Delete follow relationships and update counts
    console.log(`${dryRunPrefix}🔄 Deleting follow relationships...`);

    // Delete where user is the follower
    const followingSnapshot = await db
      .collection('follows')
      .where('followerId', '==', userId)
      .get();

    if (!options.dryRun && followingSnapshot.docs.length > 0) {
      const followBatch1 = db.batch();
      for (const doc of followingSnapshot.docs) {
        const followData = doc.data();
        // Decrement the following user's follower count
        const followingUserRef = db
          .collection('users')
          .doc(followData.followingId);
        followBatch1.update(followingUserRef, {
          followerCount: FieldValue.increment(-1),
        });
        followBatch1.delete(doc.ref);
      }
      await followBatch1.commit();
    }
    stats.follows += followingSnapshot.docs.length;

    // Delete where user is being followed
    const followersSnapshot = await db
      .collection('follows')
      .where('followingId', '==', userId)
      .get();

    if (!options.dryRun && followersSnapshot.docs.length > 0) {
      const followBatch2 = db.batch();
      for (const doc of followersSnapshot.docs) {
        const followData = doc.data();
        // Decrement the follower's following count
        const followerUserRef = db
          .collection('users')
          .doc(followData.followerId);
        followBatch2.update(followerUserRef, {
          followingCount: FieldValue.increment(-1),
        });
        followBatch2.delete(doc.ref);
      }
      await followBatch2.commit();
    }
    stats.follows += followersSnapshot.docs.length;
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.follows} follow relationships\n`
    );

    // 7. Delete streak data
    console.log(`${dryRunPrefix}🔄 Deleting streak data...`);
    const streakRef = db.collection('streaks').doc(userId);
    const streakDoc = await streakRef.get();
    if (streakDoc.exists) {
      if (!options.dryRun) {
        await streakRef.delete();
      }
      stats.streaks = 1;
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.streaks} streak records\n`
    );

    // 8. Delete challenge participations
    console.log(`${dryRunPrefix}🔄 Deleting challenge participations...`);
    const challengeParticipantsSnapshot = await db
      .collection('challengeParticipants')
      .where('userId', '==', userId)
      .get();

    stats.challengeParticipants = challengeParticipantsSnapshot.docs.length;
    if (!options.dryRun && challengeParticipantsSnapshot.docs.length > 0) {
      const challengeBatch = db.batch();
      challengeParticipantsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          challengeBatch.delete(doc.ref);
        }
      );
      await challengeBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.challengeParticipants} challenge participations\n`
    );

    // 9. Remove from group members
    console.log(`${dryRunPrefix}🔄 Removing from groups...`);
    const groupsSnapshot = await db
      .collection('groups')
      .where('members', 'array-contains', userId)
      .get();

    stats.groupMembers = groupsSnapshot.docs.length;
    if (!options.dryRun && groupsSnapshot.docs.length > 0) {
      const groupBatch = db.batch();
      groupsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          groupBatch.update(doc.ref, {
            members: FieldValue.arrayRemove(userId),
            memberCount: FieldValue.increment(-1),
          });
        }
      );
      await groupBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would remove' : 'Removed'} from ${stats.groupMembers} groups\n`
    );

    // 10. Delete notifications for this user
    console.log(`${dryRunPrefix}🔄 Deleting notifications...`);
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .get();

    stats.notifications = notificationsSnapshot.docs.length;
    if (!options.dryRun && notificationsSnapshot.docs.length > 0) {
      const notificationBatch = db.batch();
      notificationsSnapshot.docs.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          notificationBatch.delete(doc.ref);
        }
      );
      await notificationBatch.commit();
    }
    console.log(
      `   ✅ ${options.dryRun ? 'Would delete' : 'Deleted'} ${stats.notifications} notifications\n`
    );

    // 11. Delete user document
    if (!options.dryRun) {
      console.log(`${dryRunPrefix}🔄 Deleting user document...`);
      await db.collection('users').doc(userId).delete();
      stats.user = true;
      console.log('   ✅ User document deleted\n');
    } else {
      console.log(`${dryRunPrefix}🔄 Would delete user document...`);
      console.log('   ✅ Would delete\n');
      stats.user = true;
    }

    // 12. Delete Firebase Authentication account
    if (!options.dryRun) {
      console.log(`${dryRunPrefix}🔄 Deleting Firebase Auth account...`);
      try {
        await auth.deleteUser(userId);
        stats.auth = true;
        console.log('   ✅ Firebase Auth account deleted\n');
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'auth/user-not-found'
        ) {
          console.log(
            '   ⚠️  Auth account not found (may have been deleted already)\n'
          );
          stats.auth = true;
        } else {
          throw error;
        }
      }
    } else {
      console.log(`${dryRunPrefix}🔄 Would delete Firebase Auth account...`);
      console.log('   ✅ Would delete\n');
      stats.auth = true;
    }

    // Print summary
    const completionStatus = options.dryRun
      ? 'DRY RUN COMPLETE'
      : 'DELETION COMPLETE';
    console.log(`✅ ${completionStatus}\n`);
    console.log('📊 Summary:');
    console.log(`   User Document: ${stats.user ? '✅' : '❌'}`);
    console.log(`   Auth Account: ${stats.auth ? '✅' : '❌'}`);
    console.log(`   Projects: ${stats.projects}`);
    console.log(`   Tasks: ${stats.tasks}`);
    console.log(`   Sessions: ${stats.sessions}`);
    console.log(`   Comments: ${stats.comments}`);
    console.log(`   Supports: ${stats.supports}`);
    console.log(`   Follows: ${stats.follows}`);
    console.log(`   Streaks: ${stats.streaks}`);
    console.log(`   Challenge Participations: ${stats.challengeParticipants}`);
    console.log(`   Group Memberships: ${stats.groupMembers}`);
    console.log(`   Notifications: ${stats.notifications}`);
    console.log(`   Active Session Records: ${stats.activeSession}\n`);

    if (options.dryRun) {
      console.log(
        'To execute this deletion, run without the --dry-run flag.\n'
      );
    }
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  }
}

// Main execution
const userId = process.argv[2];
const dryRunFlag = process.argv.includes('--dry-run');

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/ops/deleteUser.ts <userId> [--dry-run]');
  console.log('\nExamples:');
  console.log('  npx ts-node scripts/ops/deleteUser.ts abc123xyz');
  console.log('  npx ts-node scripts/ops/deleteUser.ts abc123xyz --dry-run\n');
  process.exit(1);
}

const options: DeletionOptions = {
  dryRun: dryRunFlag,
};

deleteUser(userId, options)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
