# 🧠 AI Agent Memory — TurfBook Project

> Last updated: 2026-07-04 22:16 IST
> This file stores persistent context about the TurfBook project setup, decisions made, and issues resolved during AI-assisted development sessions.

---

## 📦 Project Overview

- **Name**: TurfBook (Turf Booking Platform)
- **Repo Root**: `d:\PROJECTS\TurfBook`
- **Architecture**: Turborepo + pnpm workspaces monorepo with Clean Architecture
- **Package Manager**: pnpm v11.9.0
- **Node Version**: v24.16.0

### Apps
| App | Path | Stack |
|-----|------|-------|
| Backend API | `apps/backend` | Node.js + Express + TypeScript |
| Admin Web | `apps/admin-web` | React 19 + Vite + Tailwind |
| Customer Web | `apps/customer-web` | React 19 + Vite + Tailwind |
| Mobile App | `apps/mobile-app` | React Native + Expo 51 |

### Shared Packages
- `packages/ui` — Shared Tailwind CSS Design System
- `packages/types` — Shared TypeScript domain models & interfaces
- `packages/config` — Centralized lint/formatting config bases
- `packages/utils` — Shared formatters and pattern checks
- `packages/api-client` — Axios client with interceptors

---

## ⚙️ Current Environment Configuration

**File**: `apps/backend/.env`

```
DATABASE_PROVIDER=firebase        ← Using Firebase (no Docker/PostgreSQL needed)
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=turfbook-74c8c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@turfbook-74c8c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=...
FIREBASE_STORAGE_BUCKET=turfbook-74c8c.appspot.com
```

> ⚠️ `DATABASE_URL` and `REDIS_URL` are intentionally omitted (Firebase mode, no Docker).

---

## 🔧 Setup Decisions & Changes Made

### 1. Switched Database Provider: Prisma → Firebase
- **Reason**: User does not want to use Docker for local development.
- **Decision**: Use `DATABASE_PROVIDER=firebase` to use Firestore instead of PostgreSQL.

### 2. `apps/backend/src/config/env.ts` — Modified
- Made `DATABASE_URL` **optional** (was `z.string().min(1)`, changed to `z.string().optional()`)
- Added fallback logic: sets `DATABASE_URL` to `'firebase'` placeholder in test/undefined env when provider is firebase
- **Why**: The Zod schema crashed at startup if `DATABASE_URL` was not set, even in Firebase mode.

### 3. `apps/backend/src/server.ts` — Modified
- Wrapped `prisma.$connect()` in `if (env.DATABASE_PROVIDER !== 'firebase')` guard
- Wrapped `prisma.$disconnect()` in graceful shutdown handler similarly
- **Why**: Server always called `prisma.$connect()` regardless of provider, causing crashes.

### 4. `apps/backend/src/database/index.ts` — Rewritten
- Replaced eager `new PrismaClient(...)` with a **lazy Proxy pattern**
- PrismaClient is only `require()`d when `DATABASE_PROVIDER` is `prisma`
- In Firebase mode, `$connect` and `$disconnect` return `Promise.resolve()` no-ops
- **Why**: `@prisma/client` threw "did not initialize yet" at module load time even in Firebase mode because `new PrismaClient()` was called unconditionally at the top level.

### 5. `apps/backend/package.json` — Modified
- Changed dev script from: `ts-node-dev --respawn --transpile-only src/server.ts`
- To: `tsx watch src/server.ts`
- Installed `tsx` as a devDependency: `pnpm add -D tsx --filter=@turf-booking/backend`
- **Why**: tsconfig uses `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` (ESM). `ts-node-dev` could not resolve `.js`-extensioned imports (`Cannot find module './app.js'`). `tsx` handles this natively.

### 6. `.agents/memory.md` — Created
- Stores all project context, environment config, code changes, and decisions.
- **Why**: Persistent memory so AI agent retains full project context across sessions.

### 7. `.agents/AGENTS.md` — Created
- Workspace rule: AI agent must update `memory.md` after every task, fix, or decision.
- Format rules defined for change entries, next steps, and environment updates.
- **Why**: Ensures memory stays current automatically without the user needing to remind the agent.

---

## ✅ Working State

```
🔌 Initializing database repository provider: FIREBASE
⚠️  REDIS_URL is not defined. Redis operations will fail.      ← harmless
⚠️  Nodemailer SMTP mailer config is missing.                  ← harmless
⚠️  Cloudinary configurations are missing.                     ← harmless
🔥 Using Firebase as database provider — skipping Prisma connection
⏰ Initializing background job scheduler...
🚀 Server running on port 5000 in development mode
📄 API Docs available at http://localhost:5000/api-docs
```

### How to Start the Backend
```bash
pnpm dev:backend
```

### First-Time Setup (one-time only)
```bash
pnpm install          # install all workspace deps
pnpm db:generate      # generates Prisma client from schema (needed even in Firebase mode)
pnpm dev:backend      # start the server
```

---

## 🔥 Firebase Project Details

| Field | Value |
|-------|-------|
| Project ID | `turfbook-74c8c` |
| Service Account | `firebase-adminsdk-fbsvc@turfbook-74c8c.iam.gserviceaccount.com` |
| Storage Bucket | `turfbook-74c8c.appspot.com` |

> ⚠️ **Security Note**: Private key is stored in `.env` which is `.gitignore`d. Never commit credentials to git.

---

## 📝 Known Warnings (Non-Breaking)

| Warning | Impact | Fix When |
|---------|--------|----------|
| `REDIS_URL not defined` | Caching disabled | Add Upstash Redis URL to `.env` |
| `Nodemailer config missing` | Email prints to console | Add SMTP config when email features needed |
| `Cloudinary config missing` | File uploads fall back to local disk | Add Cloudinary keys when image uploads needed |

---

## 🗺️ Next Steps / Pending Work

- [ ] Enable Firestore Database in Firebase Console (test mode)
- [ ] Test API endpoints via Swagger at `http://localhost:5000/api-docs`
- [ ] Optionally add Upstash Redis URL for caching support
- [ ] Set up frontend apps (`pnpm dev:admin` / `pnpm dev:customer`)

---

## 📅 Session Log

| Date | Summary |
|------|---------|
| 2026-07-04 | Initial setup: switched to Firebase provider, fixed Prisma/ESM issues, got backend running on port 5000 |
| 2026-07-04 | Created `memory.md` and `AGENTS.md` rule for persistent AI memory |
