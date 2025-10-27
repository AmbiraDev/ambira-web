/**
 * Migration script to set profileVisibility to 'everyone' for existing users
 *
 * REQUIRED FIREBASE IAM ROLES:
 * - roles/datastore.owner (or roles/firebase.admin)
 *
 * REQUIRED SERVICE ACCOUNT PERMISSIONS:
 * - datastore.databases.update
 * - datastore.databases.get
 * - datastore.entities.get
 * - datastore.entities.update
 *
 * VERIFICATION:
 * To verify your service account has required permissions, run:
 *   gcloud projects get-iam-policy PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:serviceAccount:YOUR_SA@PROJECT_ID.iam.gserviceaccount.com"
 *
 * Run with: node scripts/ops/migrate-profile-visibility.js [--dry-run]
 *
 * Examples:
 *   node scripts/ops/migrate-profile-visibility.js
 *   node scripts/ops/migrate-profile-visibility.js --dry-run
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateProfileVisibility(dryRun = false) {
  const dryRunPrefix = dryRun ? '[DRY RUN] ' : '';

  try {
    console.log(`${dryRunPrefix}Starting profile visibility migration...\n`);

    if (dryRun) {
      console.log('DRY RUN MODE - No changes will be made\n');
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    let updatedCount = 0;
    let alreadySetCount = 0;
    const usersToUpdate = [];

    for (const doc of snapshot.docs) {
      const userData = doc.data();

      // Check if profileVisibility is not set or is undefined
      if (!userData.profileVisibility) {
        usersToUpdate.push({
          id: doc.id,
          username: userData.username || 'unknown',
          current: {
            profileVisibility: userData.profileVisibility || 'not set',
            activityVisibility: userData.activityVisibility || 'not set',
            projectVisibility: userData.projectVisibility || 'not set'
          },
          proposed: {
            profileVisibility: 'everyone',
            activityVisibility: userData.activityVisibility || 'everyone',
            projectVisibility: userData.projectVisibility || 'everyone'
          }
        });
        updatedCount++;
      } else {
        alreadySetCount++;
      }
    }

    // Show preview of changes
    console.log(`Users that would be updated: ${updatedCount}\n`);

    if (usersToUpdate.length > 0 && usersToUpdate.length <= 10) {
      console.log('Users to be updated:');
      usersToUpdate.forEach((user) => {
        console.log(`  - ${user.username} (${user.id})`);
        console.log(`    Current: profileVisibility=${user.current.profileVisibility}, activityVisibility=${user.current.activityVisibility}, projectVisibility=${user.current.projectVisibility}`);
        console.log(`    Proposed: profileVisibility=${user.proposed.profileVisibility}, activityVisibility=${user.proposed.activityVisibility}, projectVisibility=${user.proposed.projectVisibility}`);
      });
    } else if (usersToUpdate.length > 10) {
      console.log('First 10 users to be updated (showing sample):');
      usersToUpdate.slice(0, 10).forEach((user) => {
        console.log(`  - ${user.username} (${user.id})`);
        console.log(`    Current: profileVisibility=${user.current.profileVisibility}, activityVisibility=${user.current.activityVisibility}, projectVisibility=${user.current.projectVisibility}`);
        console.log(`    Proposed: profileVisibility=${user.proposed.profileVisibility}, activityVisibility=${user.proposed.activityVisibility}, projectVisibility=${user.proposed.projectVisibility}`);
      });
      console.log(`  ... and ${usersToUpdate.length - 10} more`);
    }

    console.log('');

    // Execute migration if not dry run
    if (!dryRun && updatedCount > 0) {
      const batch = db.batch();
      let batchCount = 0;

      for (const user of usersToUpdate) {
        const userRef = db.collection('users').doc(user.id);
        batch.update(userRef, {
          profileVisibility: user.proposed.profileVisibility,
          activityVisibility: user.proposed.activityVisibility,
          projectVisibility: user.proposed.projectVisibility,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }

      // Commit remaining updates
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} updates`);
      }
    }

    console.log(`\n✅ ${dryRun ? 'DRY RUN' : 'Migration'} complete!`);
    console.log(`Total users: ${snapshot.size}`);
    console.log(`${dryRun ? 'Would update' : 'Updated'}: ${updatedCount}`);
    console.log(`Already set: ${alreadySetCount}`);

    if (dryRun) {
      console.log('\nTo execute this migration, run without the --dry-run flag.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const dryRunFlag = process.argv.includes('--dry-run');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Profile Visibility Migration Script');
  console.log('\nUsage:');
  console.log('  node scripts/ops/migrate-profile-visibility.js [--dry-run]');
  console.log('\nOptions:');
  console.log('  --dry-run  Show what would be updated without making changes');
  console.log('  --help     Show this help message\n');
  process.exit(0);
}

migrateProfileVisibility(dryRunFlag);
