/**
 * User Deletion Script
 *
 * This script safely deletes a user and all their associated data from Firebase.
 * It handles all collections, subcollections, and references.
 *
 * Usage:
 *   npx ts-node scripts/deleteUser.ts <userId>
 *
 * Example:
 *   npx ts-node scripts/deleteUser.ts abc123xyz
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json')) as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount)
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

async function deleteUser(userId: string): Promise<void> {
  console.log(`🚀 Starting deletion process for user: ${userId}\n`);

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
    console.log(`📋 User found: ${username} (${userId})`);
    console.log(`   Followers: ${userData?.followerCount || 0}`);
    console.log(`   Following: ${userData?.followingCount || 0}\n`);

    // Confirm deletion
    console.log('⚠️  This will permanently delete:');
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
    console.log('🔄 Deleting active session...');
    const activeSessionSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('activeSession')
      .get();

    const activeSessionBatch = db.batch();
    activeSessionSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      activeSessionBatch.delete(doc.ref);
      stats.activeSession++;
    });
    await activeSessionBatch.commit();
    console.log(`   ✅ Deleted ${stats.activeSession} active session records\n`);

    // 2. Delete all projects and their tasks
    console.log('🔄 Deleting projects and tasks...');
    const projectsSnapshot = await db
      .collection('projects')
      .doc(userId)
      .collection('userProjects')
      .get();

    for (const projectDoc of projectsSnapshot.docs) {
      // Delete tasks for this project
      const tasksSnapshot = await projectDoc.ref.collection('tasks').get();
      const taskBatch = db.batch();
      tasksSnapshot.docs.forEach((taskDoc: QueryDocumentSnapshot<DocumentData>) => {
        taskBatch.delete(taskDoc.ref);
        stats.tasks++;
      });
      await taskBatch.commit();

      // Delete project
      await projectDoc.ref.delete();
      stats.projects++;
    }

    // Delete the projects document
    await db.collection('projects').doc(userId).delete();
    console.log(`   ✅ Deleted ${stats.projects} projects and ${stats.tasks} tasks\n`);

    // 3. Delete all sessions created by this user
    console.log('🔄 Deleting sessions...');
    const sessionsSnapshot = await db
      .collection('sessions')
      .where('userId', '==', userId)
      .get();

    const sessionBatch = db.batch();
    sessionsSnapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      sessionBatch.delete(doc.ref);
      stats.sessions++;
    });
    await sessionBatch.commit();
    console.log(`   ✅ Deleted ${stats.sessions} sessions\n`);

    // 4. Delete all comments by this user
    console.log('🔄 Deleting comments...');
    const commentsSnapshot = await db
      .collection('comments')
      .where('userId', '==', userId)
      .get();

    const commentBatch = db.batch();
    commentsSnapshot.docs.forEach(doc => {
      commentBatch.delete(doc.ref);
      stats.comments++;
    });
    await commentBatch.commit();
    console.log(`   ✅ Deleted ${stats.comments} comments\n`);

    // 5. Delete all supports (likes) by this user
    console.log('🔄 Deleting supports...');
    const supportsSnapshot = await db
      .collection('supports')
      .where('userId', '==', userId)
      .get();

    const supportBatch = db.batch();
    supportsSnapshot.docs.forEach(doc => {
      supportBatch.delete(doc.ref);
      stats.supports++;
    });
    await supportBatch.commit();
    console.log(`   ✅ Deleted ${stats.supports} supports\n`);

    // 6. Delete follow relationships and update counts
    console.log('🔄 Deleting follow relationships...');

    // Delete where user is the follower
    const followingSnapshot = await db
      .collection('follows')
      .where('followerId', '==', userId)
      .get();

    const followBatch1 = db.batch();
    for (const doc of followingSnapshot.docs) {
      const followData = doc.data();
      // Decrement the following user's follower count
      const followingUserRef = db.collection('users').doc(followData.followingId);
      followBatch1.update(followingUserRef, {
        followerCount: FieldValue.increment(-1)
      });
      followBatch1.delete(doc.ref);
      stats.follows++;
    }
    await followBatch1.commit();

    // Delete where user is being followed
    const followersSnapshot = await db
      .collection('follows')
      .where('followingId', '==', userId)
      .get();

    const followBatch2 = db.batch();
    for (const doc of followersSnapshot.docs) {
      const followData = doc.data();
      // Decrement the follower's following count
      const followerUserRef = db.collection('users').doc(followData.followerId);
      followBatch2.update(followerUserRef, {
        followingCount: FieldValue.increment(-1)
      });
      followBatch2.delete(doc.ref);
      stats.follows++;
    }
    await followBatch2.commit();
    console.log(`   ✅ Deleted ${stats.follows} follow relationships\n`);

    // 7. Delete streak data
    console.log('🔄 Deleting streak data...');
    const streakRef = db.collection('streaks').doc(userId);
    const streakDoc = await streakRef.get();
    if (streakDoc.exists) {
      await streakRef.delete();
      stats.streaks = 1;
    }
    console.log(`   ✅ Deleted ${stats.streaks} streak records\n`);

    // 8. Delete challenge participations
    console.log('🔄 Deleting challenge participations...');
    const challengeParticipantsSnapshot = await db
      .collection('challengeParticipants')
      .where('userId', '==', userId)
      .get();

    const challengeBatch = db.batch();
    challengeParticipantsSnapshot.docs.forEach(doc => {
      challengeBatch.delete(doc.ref);
      stats.challengeParticipants++;
    });
    await challengeBatch.commit();
    console.log(`   ✅ Deleted ${stats.challengeParticipants} challenge participations\n`);

    // 9. Remove from group members
    console.log('🔄 Removing from groups...');
    const groupsSnapshot = await db
      .collection('groups')
      .where('members', 'array-contains', userId)
      .get();

    const groupBatch = db.batch();
    groupsSnapshot.docs.forEach(doc => {
      groupBatch.update(doc.ref, {
        members: FieldValue.arrayRemove(userId),
        memberCount: FieldValue.increment(-1)
      });
      stats.groupMembers++;
    });
    await groupBatch.commit();
    console.log(`   ✅ Removed from ${stats.groupMembers} groups\n`);

    // 10. Delete notifications for this user
    console.log('🔄 Deleting notifications...');
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .get();

    const notificationBatch = db.batch();
    notificationsSnapshot.docs.forEach(doc => {
      notificationBatch.delete(doc.ref);
      stats.notifications++;
    });
    await notificationBatch.commit();
    console.log(`   ✅ Deleted ${stats.notifications} notifications\n`);

    // 11. Delete user document
    console.log('🔄 Deleting user document...');
    await db.collection('users').doc(userId).delete();
    stats.user = true;
    console.log('   ✅ User document deleted\n');

    // 12. Delete Firebase Authentication account
    console.log('🔄 Deleting Firebase Auth account...');
    try {
      await auth.deleteUser(userId);
      stats.auth = true;
      console.log('   ✅ Firebase Auth account deleted\n');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('   ⚠️  Auth account not found (may have been deleted already)\n');
        stats.auth = true;
      } else {
        throw error;
      }
    }

    // Print summary
    console.log('✅ DELETION COMPLETE\n');
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

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  }
}

// Main execution
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/deleteUser.ts <userId>');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/deleteUser.ts abc123xyz\n');
  process.exit(1);
}

deleteUser(userId)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
