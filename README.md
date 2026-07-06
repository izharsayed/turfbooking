# Turf Booking Platform (Turborepo Monorepo)

Welcome to the production-ready foundation for the **Turf Booking Platform**. This workspace is configured as a high-performance **Turborepo** + **pnpm workspaces** monorepo implementing **Clean Architecture** with a database-agnostic **Repository Pattern** supporting both PostgreSQL (via Prisma) and Firebase Firestore.

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
turf-booking/
├── apps/
│   ├── admin-web/       # React 19 + Vite + Tailwind Admin/Owner portal
│   ├── customer-web/    # React 19 + Vite + Tailwind Customer portal
│   ├── mobile-app/      # React Native + Expo 51 + Expo Router Mobile app
│   └── backend/         # Node.js + Express API server (Clean Architecture)
├── packages/
│   ├── ui/              # Shared Tailwind CSS Design System Button & stubs
│   ├── types/           # Shared TypeScript domain models & interfaces
│   ├── config/          # Centralized lint/formatting config bases
│   ├── utils/           # Shared formatters and pattern checks
│   └── api-client/      # Axios client with interceptors
├── prisma/              # PostgreSQL Prisma Schema modeling
├── docker/              # Infrastructure Dockerfiles
└── scripts/             # Initialization & dev tools scripts
```

---

## ⚙️ Environment Configuration

Create a `.env` file in `apps/backend/` using the following properties from `.env.example`:

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
- pnpm (v9 or higher; automatically configured)
- Docker Desktop (if running PostgreSQL/Redis locally)

### 1. Bootstrapping Workspace
Install and link all dependencies across workspaces:
```bash
pnpm install
```

### 2. Infrastructure Setup

#### PostgreSQL Setup (Docker)
Start the local PostgreSQL, Redis, and PgAdmin containers:
```bash
docker-compose up -d
```
Generate the Prisma Client mapping:
```bash
pnpm db:generate
```

#### Firebase Setup (Optional)
If running Firebase Firestore, ensure `DATABASE_PROVIDER=firebase` is set in your `.env` and valid credentials are added. The server will initialize connection handlers using the Firebase Admin SDK.

### 3. Launch Development Servers (via Turborepo)
Start all workspace applications concurrently in development mode (with caching disabled for local dev):
```bash
# Start all apps in dev mode
pnpm dev

# Or start a specific workspace
pnpm dev:backend
pnpm dev:admin
pnpm dev:customer
pnpm dev:mobile
```

---

## 🎯 Coding Standards & Development Guidelines

1. **Repository Pattern**: Always define model methods in `apps/backend/src/repositories/interfaces/` before creating database implementations. Write both Prisma (relational) and Firebase (NoSQL document) classes.
2. **SOLID Principles**: Keep controller methods limited to request handling, services focused entirely on business rules, and repositories limited to DB read/write actions.
3. **No Direct ORM Imports**: Never import `prisma` or `firebaseApp` inside services or controllers. Always access them via the exported repositories (`userRepository`, `turfRepository` etc.) from the factory layer.
4. **Conventional Commits**: Ensure commits are prefixed for automated versioning:
   - `feat: add turf slot search`
   - `fix: resolve jwt expiration crash`
   - `chore: update tsconfig packages`
