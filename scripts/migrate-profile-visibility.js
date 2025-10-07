/**
 * Migration script to set profileVisibility to 'everyone' for existing users
 * Run with: node scripts/migrate-profile-visibility.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateProfileVisibility() {
  try {
    console.log('Starting profile visibility migration...');
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    let updatedCount = 0;
    let alreadySetCount = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      // Check if profileVisibility is not set or is undefined
      if (!userData.profileVisibility) {
        batch.update(doc.ref, {
          profileVisibility: 'everyone',
          activityVisibility: userData.activityVisibility || 'everyone',
          projectVisibility: userData.projectVisibility || 'everyone',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updatedCount++;
        batchCount++;
        
        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } else {
        alreadySetCount++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`Total users: ${snapshot.size}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Already set: ${alreadySetCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProfileVisibility();
