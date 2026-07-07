import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Sports
  console.log('  Seeding Sports...');
  const sports = [
    { name: 'Football', slug: 'football', description: '5-a-side, 7-a-side and 11-a-side football turfs' },
    { name: 'Cricket', slug: 'cricket', description: 'Net cricket and full ground cricket' },
    { name: 'Box Cricket', slug: 'box-cricket', description: 'Indoor box cricket zones' },
    { name: 'Badminton', slug: 'badminton', description: 'Wooden and synthetic courts' },
    { name: 'Tennis', slug: 'tennis', description: 'Clay and hard court tennis zones' },
    { name: 'Basketball', slug: 'basketball', description: 'Indoor and outdoor courts' },
    { name: 'Volleyball', slug: 'volleyball', description: 'Sand and indoor courts' },
    { name: 'Pickleball', slug: 'pickleball', description: 'Standard pickleball court installations' },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { name: sport.name },
      update: {},
      create: sport,
    });
  }

  // 2. Seed Amenities
  console.log('  Seeding Amenities...');
  const amenities = [
    { name: 'Parking', iconUrl: 'parking-icon', description: 'Dedicated two-wheeler and four-wheeler parking spaces' },
    { name: 'Washroom', iconUrl: 'washroom-icon', description: 'Clean rest rooms' },
    { name: 'Changing Room', iconUrl: 'changing-icon', description: 'Locker and changing facility' },
    { name: 'Drinking Water', iconUrl: 'water-icon', description: 'Purified drinking water' },
    { name: 'Flood Lights', iconUrl: 'lights-icon', description: 'LED high-intensity evening floodlights' },
    { name: 'Cafeteria', iconUrl: 'cafe-icon', description: 'In-house snacks and beverage counter' },
    { name: 'WiFi', iconUrl: 'wifi-icon', description: 'Complimentary high-speed WiFi' },
  ];

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: amenity,
    });
  }

  // 3. Seed Cities & Areas
  console.log('  Seeding Cities and Areas...');
  const mumbai = await prisma.city.upsert({
    where: { slug: 'mumbai' },
    update: {},
    create: {
      name: 'Mumbai',
      slug: 'mumbai',
      state: 'Maharashtra',
    },
  });

  const areas = [
    { name: 'Andheri West', slug: 'andheri-west', zipcode: '400053', cityId: mumbai.id },
    { name: 'Bandra West', slug: 'bandra-west', zipcode: '400050', cityId: mumbai.id },
  ];

  for (const area of areas) {
    await prisma.area.upsert({
      where: { cityId_slug: { cityId: area.cityId, slug: area.slug } },
      update: {},
      create: area,
    });
  }

  // 4. Seed Subscription Plans (OwnerPlan)
  console.log('  Seeding Owner Plans...');
  const plans = [
    {
      name: 'Basic Starter',
      description: 'Perfect for small single-turf owners just starting out.',
      price: 999.0,
      durationDays: 30,
      maxTurfs: 1,
      features: JSON.stringify(['1 Turf Listing', 'Basic Analytics', 'Standard Bookings']),
    },
    {
      name: 'Professional Pro',
      description: 'Best for turf clubs managing multiple sports spaces.',
      price: 2999.0,
      durationDays: 30,
      maxTurfs: 5,
      features: JSON.stringify(['Up to 5 Turfs', 'Advanced Occupancy Analytics', 'Priority Support', 'Custom Holiday Rules']),
    },
  ];

  for (const plan of plans) {
    await prisma.ownerPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: {
        ...plan,
        features: JSON.parse(plan.features),
      },
    });
  }

  // 5. Seed Super Admin User
  console.log('  Seeding Super Admin user...');
  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  await prisma.user.upsert({
    where: { email: 'admin@turfbook.com' },
    update: {},
    create: {
      email: 'admin@turfbook.com',
      passwordHash,
      phone: '9999999999',
      role: UserRole.SUPER_ADMIN,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
        },
      },
    },
  });

  // 6. Seed Application Settings
  console.log('  Seeding Application Settings...');
  const settings = [
    { key: 'PLATFORM_COMMISSION_PERCENTAGE', value: '10.0', description: 'Default commission percentage charged on booking final amount', isSystem: true },
    { key: 'CONVENIENCE_FEE_INR', value: '25.0', description: 'Flat convenience fee added to bookings', isSystem: true },
    { key: 'TAX_PERCENTAGE', value: '18.0', description: 'Default GST percentage applicable to booking slots', isSystem: false },
  ];

  for (const setting of settings) {
    await prisma.applicationSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
