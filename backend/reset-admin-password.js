/**
 * Reset admin password in Firestore
 * Run with: node reset-admin-password.js
 */
require('dotenv').config({ path: './.env' });
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function resetPassword() {
  const NEW_PASSWORD = 'Admin123';

  console.log('🔑 Resetting admin password...');

  // Find the admin user
  const snap = await db.collection('users')
    .where('email', '==', 'admin@turfbook.com')
    .limit(1)
    .get();

  if (snap.empty) {
    console.log('❌ Admin user not found in Firestore!');
    process.exit(1);
  }

  const doc = snap.docs[0];
  const newHash = await bcrypt.hash(NEW_PASSWORD, 10);

  // Verify the hash works before saving
  const verified = await bcrypt.compare(NEW_PASSWORD, newHash);
  if (!verified) {
    console.log('❌ Hash verification failed! Something is wrong with bcrypt.');
    process.exit(1);
  }

  await db.collection('users').doc(doc.id).update({
    passwordHash: newHash,
    updatedAt: new Date(),
  });

  console.log(`✅ Password reset successfully!`);
  console.log(`   User ID:  ${doc.id}`);
  console.log(`   Email:    admin@turfbook.com`);
  console.log(`   Password: ${NEW_PASSWORD}`);
  console.log(`   Hash:     ${newHash}`);
  console.log(`   Verified: ${verified}`);

  process.exit(0);
}

resetPassword().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
