/**
 * Diagnostic script — checks if the admin user exists and is queryable in Firestore
 * Run with: node check-firebase-admin.js
 */
require('dotenv').config({ path: './.env' });
const admin = require('firebase-admin');

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

async function check() {
  console.log('🔍 Checking Firestore for admin user...\n');

  // 1. List ALL users in the collection
  console.log('--- All documents in "users" collection ---');
  const allUsers = await db.collection('users').get();
  if (allUsers.empty) {
    console.log('❌ The "users" collection is EMPTY!');
  } else {
    allUsers.forEach(doc => {
      const d = doc.data();
      console.log(`  ID: ${doc.id}`);
      console.log(`  email: ${d.email}`);
      console.log(`  role: ${d.role}`);
      console.log(`  isActive: ${d.isActive}`);
      console.log(`  has passwordHash: ${!!d.passwordHash}`);
      console.log('');
    });
  }

  // 2. Query by exact email
  console.log('--- Query: where("email", "==", "admin@turfbook.com") ---');
  const snap = await db.collection('users')
    .where('email', '==', 'admin@turfbook.com')
    .limit(1)
    .get();

  if (snap.empty) {
    console.log('❌ Query returned EMPTY — email index or value mismatch!');
  } else {
    const doc = snap.docs[0];
    console.log('✅ Found user via email query!');
    console.log(`  ID: ${doc.id}`);
    console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
  }

  process.exit(0);
}

check().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
