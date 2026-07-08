# Turf Booking Platform (npm Monorepo)

Welcome to the production-ready repository for the **Turf Booking Platform**. This workspace is configured as a multi-package monorepo implementing **Clean Architecture** with a database-agnostic **Repository Pattern** supporting both PostgreSQL (via Prisma) and Firebase Firestore.

---

## 🏗️ Architecture & Decoupled Database Design

This system is built using **Clean Architecture** to ensure that business rules are entirely decoupled from framework layers, database configurations, and client presentation details.

### Clean Architecture Layers
```text
  [ Client (Web/Mobile) ]
            │
            ▼
     [ Controllers ] (Express HTTP Request Handlers)
            │
            ▼
       [ Services ] (Pure Business Logic - Database Blind)
            │
            ▼
 [ Repository Interfaces ] (Abstract DB Signatures: IUserRepository, etc.)
            │
      ┌─────┴──────────────┐
      ▼                    ▼
[ Prisma Repos ]    [ Firebase Repos ] (Concrete Implementations)
      │                    │
      ▼                    ▼
 [ PostgreSQL ]       [ Firestore ]
```

- **Database Independence**: Business services only import and call **Repository Interfaces** (e.g., `IUserRepository`). The active database implementation is dynamically resolved at boot time using the `DATABASE_PROVIDER` environment variable.
- **Provider Switching**: Set `DATABASE_PROVIDER=prisma` (PostgreSQL) or `DATABASE_PROVIDER=firebase` (Firestore). The business logic behaves identically without needing modification.

---

## 📂 Folder Structure

```text
TurfBook/
├── backend/          # Node.js + Express API server (Clean Architecture)
├── frontend/         # React + Vite + Tailwind CSS Web client (Customer & Vendor Portal)
├── mobile/           # React Native + Expo Go (SDK 54.0.8) Mobile app
├── prisma/           # PostgreSQL Prisma schema modeling & migrations
├── firebase/         # Firestore rules, indexes, and initialization configs
├── docker/           # Infrastructure docker compose configurations
└── scripts/          # Workspace setup and utility helper scripts
```

---

## ⚙️ Environment Configuration

Create a `.env` file in `backend/` using the following properties:

```bash
# Provider selector: "prisma" or "firebase"
DATABASE_PROVIDER=prisma

# Relational DB (PostgreSQL) URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/turf_booking?schema=public"

# Redis Cache URL
REDIS_URL="redis://localhost:6379"

# Token secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key"
JWT_EXPIRE="7d"

# Integration API Keys
CLOUDINARY_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_SECRET="your_razorpay_secret"

# Firebase Credentials (for DATABASE_PROVIDER=firebase or FCM notifications)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-firebase-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET="your-firebase-project.appspot.com"
```

---

## 🚀 Getting Started (Installation & Setup)

### Prerequisites
- Node.js (v18 or higher)
- npm (v10 or higher)
- Docker Desktop (if running PostgreSQL/Redis locally)

### 1. Bootstrap Workspace
Install all dependencies across the monorepo apps:
```bash
npm install
```

### 2. Infrastructure Setup

#### PostgreSQL Setup (Docker)
Start the local PostgreSQL, Redis, and PgAdmin containers:
```bash
docker-compose up -d
```
Generate the Prisma Client mapping:
```bash
npm run db:generate --prefix backend
```

#### Firebase Setup (Optional)
If running Firebase Firestore, ensure `DATABASE_PROVIDER=firebase` is set in your `.env` and valid credentials are added. The server will initialize connection handlers using the Firebase Admin SDK.

### 3. Launch Development Servers
Start workspace applications in development mode from the root directory:
```bash
# Run backend development server
npm run dev:backend

# Run frontend web client
npm run dev:web

# Run mobile app (Expo Go)
npm run dev:mobile   # Or simply: npm run mobile
```

---

## 🎯 Coding Standards & Development Guidelines

1. **Repository Pattern**: Always define model methods in `backend/src/repositories/interfaces/` before creating database implementations. Write both Prisma (relational) and Firebase (NoSQL document) classes.
2. **SOLID Principles**: Keep controller methods limited to request handling, services focused entirely on business logic, and repositories limited to DB read/write actions.
3. **No Direct ORM Imports**: Never import `prisma` or `firebaseApp` inside services or controllers. Always access them via the exported repositories factory layer.
4. **Conventional Commits**: Ensure commits are prefixed for automated versioning:
   - `feat: add turf slot search`
   - `fix: resolve jwt expiration crash`
   - `chore: update tsconfig packages`
