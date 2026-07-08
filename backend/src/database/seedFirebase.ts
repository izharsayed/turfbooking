import './loadEnv.js';
import bcrypt from 'bcryptjs';
import { firestoreDb } from '../config/firebase.js';
import '../config/env.js';

async function seed() {
  console.log('🌱 Starting Firebase Seeding...');
  if (!firestoreDb) {
    console.error('❌ firestoreDb is null. Ensure credentials are correct.');
    process.exit(1);
  }

  // 1. Seed Sports
  console.log('Seeding Sports...');
  const sportsData = [
    { name: 'Football', slug: 'football', description: 'Football turf' },
    { name: 'Cricket', slug: 'cricket', description: 'Cricket court' },
    { name: 'Box Cricket', slug: 'box-cricket', description: 'Box cricket court' }
  ];

  const sportsMap: Record<string, string> = {};
  for (const s of sportsData) {
    // Check if exists
    const existing = await firestoreDb.collection('sports').where('slug', '==', s.slug).limit(1).get();
    if (existing.empty) {
      const docRef = firestoreDb.collection('sports').doc();
      await docRef.set({
        ...s,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sportsMap[s.slug] = docRef.id;
      console.log(`Created sport: ${s.name} (${docRef.id})`);
    } else {
      sportsMap[s.slug] = existing.docs[0].id;
      console.log(`Sport already exists: ${s.name} (${existing.docs[0].id})`);
    }
  }

  // 2. Seed Cities and Areas
  console.log('Seeding Cities and Areas...');
  const citySlug = 'ahmednagar';
  let cityId = '';
  const existingCity = await firestoreDb.collection('cities').where('slug', '==', citySlug).limit(1).get();
  if (existingCity.empty) {
    const docRef = firestoreDb.collection('cities').doc();
    await docRef.set({
      name: 'Ahmednagar',
      slug: citySlug,
      state: 'Maharashtra',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    cityId = docRef.id;
    console.log(`Created city: Ahmednagar (${cityId})`);
  } else {
    cityId = existingCity.docs[0].id;
    console.log(`City already exists: Ahmednagar (${cityId})`);
  }

  const areasData = [
    { name: 'Savedi', slug: 'savedi', zipcode: '414003' },
    { name: 'Pipeline Road', slug: 'pipeline-road', zipcode: '414003' },
    { name: 'Gulmohar Road', slug: 'gulmohar-road', zipcode: '414003' }
  ];

  const areasMap: Record<string, string> = {};
  for (const a of areasData) {
    const existingArea = await firestoreDb.collection('areas').where('slug', '==', a.slug).where('cityId', '==', cityId).limit(1).get();
    if (existingArea.empty) {
      const docRef = firestoreDb.collection('areas').doc();
      await docRef.set({
        cityId,
        ...a,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      areasMap[a.slug] = docRef.id;
      console.log(`Created area: ${a.name} (${docRef.id})`);
    } else {
      areasMap[a.slug] = existingArea.docs[0].id;
      console.log(`Area already exists: ${a.name} (${existingArea.docs[0].id})`);
    }
  }

  // 3. Seed Users
  console.log('Seeding Users...');
  const passwordHash = await bcrypt.hash('password', 10);

  const usersData = [
    {
      email: 'owner@turfbook.com',
      phone: '9999988888',
      role: 'TURF_OWNER',
      name: 'Ahmednagar Sports Arena',
      profileCollection: 'owner_profiles',
      profileData: {
        companyName: 'Ahmednagar Sports Arena',
        businessRegisterNumber: 'REG-12345',
        businessAddress: 'Savedi Road, Ahmednagar',
        billingEmail: 'billing@ahmednagarsports.com'
      }
    },
    {
      email: 'customer@turfbook.com',
      phone: '9876543210',
      role: 'CUSTOMER',
      name: 'Demo Customer',
      profileCollection: 'user_profiles',
      profileData: {
        firstName: 'Demo',
        lastName: 'Customer'
      }
    },
    {
      email: 'admin@turfbook.com',
      phone: '8888877777',
      role: 'SUPER_ADMIN',
      name: 'System Admin',
      profileCollection: 'user_profiles',
      profileData: {
        firstName: 'System',
        lastName: 'Admin'
      }
    }
  ];

  const usersMap: Record<string, string> = {};
  for (const u of usersData) {
    const existingUser = await firestoreDb.collection('users').where('email', '==', u.email).limit(1).get();
    let userId = '';
    if (existingUser.empty) {
      const docRef = firestoreDb.collection('users').doc();
      userId = docRef.id;
      await docRef.set({
        email: u.email,
        phone: u.phone,
        passwordHash,
        role: u.role,
        isActive: true,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      });
      await firestoreDb.collection(u.profileCollection).doc(userId).set({
        userId,
        ...u.profileData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created user: ${u.email} (${userId})`);
    } else {
      userId = existingUser.docs[0].id;
      await firestoreDb.collection('users').doc(userId).update({
        phone: u.phone,
        role: u.role,
        passwordHash,
        isActive: true
      });
      console.log(`User already exists: ${u.email} (${userId}) - updated password hash, phone, role, and active status.`);
    }
    usersMap[u.email] = userId;
  }

  // 4. Seed Turfs
  console.log('Seeding Turfs...');
  const ownerId = usersMap['owner@turfbook.com'];
  const footballSportId = sportsMap['football'] || 'football';

  const turfsData = [
    {
      name: 'Old Trafford Arena',
      description: 'Premier indoor turf with professional lighting, FIFA-grade grass pitch, and standard changing rooms.',
      location: {
        city: 'Ahmednagar',
        area: 'Savedi',
        address: 'Savedi Rd, Ahmednagar, Maharashtra 414003',
        latitude: 19.1158,
        longitude: 74.7420
      },
      images: ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60'],
      amenities: ['Washroom', 'Parking', 'Flood Lights', 'Changing Room'],
      sports: [footballSportId],
      pricePerHour: 1200,
      isActive: true,
      rating: 4.8,
      numReviews: 3
    },
    {
      name: 'Camp Nou Arena',
      description: 'Elite turf with professional coaching, premium synthetic grass, and fully featured changing zones.',
      location: {
        city: 'Ahmednagar',
        area: 'Gulmohar Road',
        address: 'Gulmohar Road, Ahmednagar, Maharashtra 414003',
        latitude: 19.1235,
        longitude: 74.7485
      },
      images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60'],
      amenities: ['Washroom', 'Parking', 'Flood Lights', 'Locker Room'],
      sports: [footballSportId],
      pricePerHour: 1800,
      isActive: true,
      rating: 4.9,
      numReviews: 1
    }
  ];

  const turfsMap: Record<string, string> = {};
  for (const t of turfsData) {
    const existingTurf = await firestoreDb.collection('turfs').where('name', '==', t.name).where('ownerId', '==', ownerId).limit(1).get();
    if (existingTurf.empty) {
      const docRef = firestoreDb.collection('turfs').doc();
      await docRef.set({
        ownerId,
        ...t,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      turfsMap[t.name] = docRef.id;
      console.log(`Created turf: ${t.name} (${docRef.id})`);
    } else {
      turfsMap[t.name] = existingTurf.docs[0].id;
      console.log(`Turf already exists: ${t.name} (${existingTurf.docs[0].id})`);
    }
  }

  // 5. Seed Bookings
  console.log('Seeding Bookings...');
  const customerId = usersMap['customer@turfbook.com'];
  const oldTraffordId = turfsMap['Old Trafford Arena'];
  const campNouId = turfsMap['Camp Nou Arena'];

  const bookingsData = [
    {
      userId: customerId,
      turfId: oldTraffordId,
      slotId: 'Monday-17',
      totalAmount: 1200,
      status: 'CONFIRMED',
      customerName: 'Rahul Shinde',
      customerPhone: '9822334455',
      date: '2026-07-06',
      timeSlot: '17:00 - 18:00',
      sport: 'Football',
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE'
    },
    {
      userId: customerId,
      turfId: campNouId,
      slotId: 'Monday-18',
      totalAmount: 1800,
      status: 'COMPLETED',
      customerName: 'Amit Patil',
      customerPhone: '9088776655',
      date: '2026-07-06',
      timeSlot: '18:00 - 19:00',
      sport: 'Football',
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE'
    },
    {
      userId: customerId,
      turfId: oldTraffordId,
      slotId: 'Tuesday-8',
      totalAmount: 1200,
      status: 'CONFIRMED',
      customerName: 'Vikas Kale',
      customerPhone: '9122334455',
      date: '2026-07-07',
      timeSlot: '08:00 - 09:00',
      sport: 'Football',
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE'
    }
  ];

  for (const b of bookingsData) {
    const existingBooking = await firestoreDb.collection('bookings')
      .where('turfId', '==', b.turfId)
      .where('date', '==', b.date)
      .where('timeSlot', '==', b.timeSlot)
      .limit(1)
      .get();
    if (existingBooking.empty) {
      const docRef = firestoreDb.collection('bookings').doc();
      await docRef.set({
        ...b,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created booking for ${b.customerName} (${docRef.id})`);
    } else {
      console.log(`Booking already exists for ${b.customerName}`);
    }
  }

  // 6. Seed Reviews
  console.log('Seeding Reviews...');
  const reviewsData = [
    {
      userId: customerId,
      turfId: oldTraffordId,
      customerName: 'Rohan Deshmukh',
      turfName: 'Old Trafford Arena',
      rating: 5,
      comment: 'Superb grass quality and amazing floodlights! Changing rooms were clean too.',
      date: '2026-07-05',
    },
    {
      userId: customerId,
      turfId: campNouId,
      customerName: 'Sanjay More',
      turfName: 'Camp Nou Arena',
      rating: 4,
      comment: 'Coaching staff was professional. Pitch is slightly fast but great fun.',
      date: '2026-07-04',
    },
    {
      userId: customerId,
      turfId: oldTraffordId,
      customerName: 'Anil Kadam',
      turfName: 'Old Trafford Arena',
      rating: 3,
      comment: 'Pitches are good but parking was a bit crowded during the evening peak hours.',
      date: '2026-07-03',
      ownerReply: 'Thanks for the feedback Anil. We are expanding our parking spaces this week!'
    }
  ];

  for (const r of reviewsData) {
    const existingReview = await firestoreDb.collection('reviews')
      .where('turfId', '==', r.turfId)
      .where('customerName', '==', r.customerName)
      .limit(1)
      .get();
    if (existingReview.empty) {
      const docRef = firestoreDb.collection('reviews').doc();
      await docRef.set({
        ...r,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created review by ${r.customerName} (${docRef.id})`);
    } else {
      console.log(`Review already exists by ${r.customerName}`);
    }
  }

  console.log('🎉 Seeding successfully completed!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
