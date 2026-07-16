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

> ### 🚨 SECURITY: rotate previously committed secrets
> Real credentials (a Firebase Admin service-account private key, Razorpay key ID + secret,
> and the Firebase web config) were previously committed to this repository in `.env` files.
> **Removing them from the working tree does NOT remove them from git history** — anyone with
> access to the repo (or any clone/fork) can still recover them. Before deploying:
> 1. **Rotate the Firebase service-account key**: Firebase Console → Project Settings →
>    Service Accounts → generate a new private key, then delete the old key in
>    Google Cloud Console → IAM & Admin → Service Accounts → Keys.
> 2. **Deactivate the old Razorpay key pair** (`rzp_test_TCyMJrrvTVxEh2`): Razorpay has been
>    removed from this platform entirely, so disable the keys in the Razorpay Dashboard →
>    Settings → API Keys rather than regenerating them.
> 3. **Restrict the Firebase Web API key** (`AIzaSy…`): it is public by design, but add
>    application restrictions in Google Cloud Console → APIs & Services → Credentials,
>    and verify Firestore/Storage Security Rules deny unauthorized access.
> 4. Consider scrubbing history with `git filter-repo` / BFG if the repo is or becomes public.

Copy the example files and fill in real values (never commit `.env` files — they are gitignored):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example mobile/.env
```

Backend variables (see [backend/.env.example](backend/.env.example) for the full annotated list):

```bash
# Provider selector: "prisma" or "firebase"
DATABASE_PROVIDER=prisma

# Relational DB (PostgreSQL) URL
DATABASE_URL="postgresql://user:password@localhost:5432/turf_booking?schema=public"

# Redis Cache URL
REDIS_URL="redis://localhost:6379"

# Token secrets (generate strong random values, e.g. `openssl rand -base64 48`)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key"
JWT_EXPIRE="7d"

# Integration API Keys (server-side only)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Firebase service-account credentials (server-side ONLY — never ship to a client)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-firebase-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET="your-firebase-project.appspot.com"
```

Client env rules:
- **frontend/** (Vite): every `VITE_*` variable is bundled into the browser build. Only public-safe values (like the API URL) belong here.
- **mobile/** (Expo): every `EXPO_PUBLIC_*` variable is embedded in the app bundle. Only the Firebase **web** config and Google OAuth **client ID** belong here — never the Firebase Admin private key or JWT secrets.

> **Payments**: the platform uses direct UPI settlement to the turf owner's UPI ID plus
> owner-side booking confirmation. No payment gateway SDK or gateway credentials are required.

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
