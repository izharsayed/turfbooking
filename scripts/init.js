const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏁 Starting Turf Booking Platform Workspace Initialization...');

// 1. Check Node version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
if (majorVersion < 18) {
  console.error(`❌ Node.js version 18 or higher is required. Current version: ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node.js version check passed: v${nodeVersion}`);

// 2. Install dependencies
console.log('📦 Installing workspace dependencies (this may take a few moments)...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully.');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// 3. Initialize Prisma client
console.log('💾 Running Prisma client generation...');
try {
  execSync('npm run db:generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully.');
} catch (error) {
  console.warn('⚠️ Prisma client generation failed. Make sure you run "npm run db:generate" once postgres is active.');
}

console.log('\n🎉 Monorepo initialization complete! Run the following commands to get started:');
console.log(' 👉 Run backend in development:      npm run dev:backend');
console.log(' 👉 Run admin portal in development:  npm run dev:admin');
console.log(' 👉 Run customer web in development: npm run dev:customer');
console.log(' 👉 Run mobile app:                  npm run dev:mobile');
console.log(' 👉 Start Docker services:           docker-compose up -d\n');
