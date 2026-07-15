import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Firebase environment variables are missing!');
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

const db = admin.firestore();

async function run() {
  console.log('Querying user details for 123456@gmail.com...');
  const snap = await db.collection('users').where('email', '==', '123456@gmail.com').get();
  if (snap.empty) {
    console.log('No user found with email 123456@gmail.com');
  } else {
    snap.forEach(doc => {
      console.log('User Document:', { id: doc.id, ...doc.data() });
    });
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
