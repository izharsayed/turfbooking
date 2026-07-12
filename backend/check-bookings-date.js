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
  console.log('🔍 Querying Bookings...\n');

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  console.log(`Today's Date String: "${todayStr}"\n`);

  const bookings = await db.collection('bookings').get();
  console.log(`Total Bookings in DB: ${bookings.size}\n`);

  bookings.forEach(doc => {
    const data = doc.data();
    console.log(`Booking ID: ${doc.id}`);
    console.log(`  Date in Firestore: "${data.date}" (type: ${typeof data.date})`);
    console.log(`  Time/Slot: "${data.time}" | "${data.timeSlot}"`);
    console.log(`  Status: "${data.status}"`);
    console.log(`  PaymentStatus: "${data.paymentStatus}"`);
    console.log(`  DeletedAt: "${data.deletedAt}"`);
    console.log(`  CreatedAt: "${data.createdAt?.toDate?.() || data.createdAt}"`);
    console.log('');
  });

  process.exit(0);
}

check().catch(console.error);
