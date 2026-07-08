/**
 * Firebase Seed Script
 * Creates the Super Admin user directly in Firestore.
 * Run with: node seed-firebase-admin.js
 */

require('dotenv').config({ path: './.env' });
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Initialize Firebase Admin
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore(app);

async function seed() {
  console.log('🌱 Starting Firebase seeding...');

  // --- Create Super Admin User ---
  console.log('  Creating Super Admin user...');

  // Check if admin already exists
  const existing = await db.collection('users')
    .where('email', '==', 'admin@turfbook.com')
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log('  ✅ Super Admin already exists in Firestore — skipping creation.');
    console.log('     Email: admin@turfbook.com');
    console.log('     Password: Admin@12345');
  } else {
    const passwordHash = await bcrypt.hash('Admin@12345', 10);
    const docRef = db.collection('users').doc(); // auto-generate ID
    const userId = docRef.id;

    await docRef.set({
      email: 'admin@turfbook.com',
      phone: '9999999999',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,          // Admin is immediately active
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    // Create admin profile
    await db.collection('user_profiles').doc(userId).set({
      userId,
      firstName: 'Super',
      lastName: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('  ✅ Super Admin created successfully!');
    console.log(`     User ID: ${userId}`);
    console.log('     Email: admin@turfbook.com');
    console.log('     Password: Admin@12345');
  }

  console.log('\n🌱 Firebase seeding completed!');
  console.log('\n📌 You can now log in to the Admin Panel with:');
  console.log('   Email:    admin@turfbook.com');
  console.log('   Password: Admin@12345');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
