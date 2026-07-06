# 🧠 AI Agent Memory — TurfBook Project

> Last updated: 2026-07-06 16:25 IST
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

### 8. `apps/customer-web/src/index.css` — Modified
- Imported Google Fonts ("Plus Jakarta Sans" and "Outfit").
- Set default sans-serif font family to `'Plus Jakarta Sans', 'Outfit'`.
- **Why**: Standard sans-serif stack looked generic and unpolished; new typography aligns with modern premium design standards.

### 9. `apps/customer-web/src/App.tsx` — Modified
- Restructured layout using radial glowing background accents.
- Replaced broken Unsplash image URLs with working, high-quality sports turf photos.
- Integrated `lucide-react` icons inside categories, search tabs, and details lists.
- Refined dark and light mode contrasts to comply with high color-contrast guidelines.
- **Why**: Elevates visual aesthetics and fixes broken images shown in the landing page screenshot.

### 10. `apps/customer-web/src/App.tsx` — Modified
- Embedded a subtle, dark-masked background turf image overlay on the top absolute container.
- Added linear gradient masks to ensure high readability and contrast for hero texts in both dark and light modes.
- **Why**: Responds to user request to add a turf image into the page background.

### 11. `apps/customer-web/src/App.tsx` — Modified
- Replaced the background turf photo with a highly vibrant green grass texture and increased opacity (`opacity-[0.15]` in dark and `opacity-[0.08]` in light mode).
- Fixed the broken Wembley Futsal Dome card image by linking a working Unsplash sport dome URL.
- **Why**: Resolves visibility issues where the background turf was too faint to see in light mode, and fixes the broken Wembley dome card.

### 12. `apps/customer-web/public/images/turf-bg.jpg` — Created
- Saved user-provided turf photo locally (422 KB) at `apps/customer-web/public/images/turf-bg.jpg`.
- Updated `App.tsx` to reference `/images/turf-bg.jpg` instead of any external Unsplash URL.
- Bumped opacity slightly to `0.18` (dark) / `0.10` (light) for better visibility.
- **Why**: User requested the image be stored locally so it doesn't depend on an external network URL.

### 13. `apps/customer-web/src/App.tsx` — Modified
- Replaced CSS `mix-blend-overlay/multiply` approach (which made image invisible on light mode) with inline `opacity` style directly on the `<img>` tag.
- Used inline gradient `style` props for the dark/light mode overlay — more reliable across browser rendering engines.
- Changed container from `absolute` to `fixed` so the background stays pinned during scroll.
- **Why**: Fixes the "image not loading" report — the image was loading but `mix-blend-multiply` on a light background made it invisible. Now clearly visible in both dark (35% opacity) and light (22% opacity) modes.

### 14. `apps/customer-web/src/App.tsx` — Modified
- Restored the local turf background image.
- Updated the header styling to use transparent backgrounds (`bg-transparent`) instead of semi-opaque white/dark backgrounds.
- This allows the restored background turf image to flow smoothly behind the floating pill-style navbar.
- **Why**: Responds to user request to keep the turf background image but make the navbar transparent/glassmorphic like the reference image.

### 15. `apps/customer-web/src/App.tsx` & `store/authStore.ts` — Modified
- Redesigned the auth modal to establish **Phone Number** as the primary field for login and sign up.
- Integrated a premium sliding tab toggle between **Password Login** and **OTP Login**.
- Configured dynamic form layouts that simulate OTP code generation/dispatched alerts matching the backend `/send-otp` and `/verify-otp` endpoints.
- Mapped phone property inside `UserProfile` state store interface.
- **Why**: Implements phone-number focused login/signup flow as requested by the user.

### 16. `apps/mobile-app/app/index.tsx` & `store/authStore.ts` — Modified
- Upgraded the mobile app's authentication screens to align on **Phone Number** as primary credentials.
- Created `authTabButton` stylesheet classes to prevent style collisions with main tab layouts.
- Integrated phone code indicator badges, OTP send dialog triggers, and password modes matching the customer-web client flow.
- **Why**: Ensures consistency across both Customer Web and Mobile applications for the phone-primary login flow.

### 17. `apps/customer-web/src/App.tsx` & `apps/mobile-app/app/index.tsx` — Modified
- Styled all login/signup input fields with solid white background (`bg-white` / `#ffffff`) and dark text color (`text-slate-900` / `#0f172a`).
- Set custom border parameters (`border-slate-700/30` / `#cbd5e1`) to match the user's reference modal layout.
- Styled labels to uppercase font matching the screenshot design.
- **Why**: Matches the auth forms design with the user's reference UI.

### 18. `apps/customer-web/src/App.tsx` — Modified
- Removed the top logo block and header title ("Welcome Back" / "Create Account") from the auth modal overlay.
- Re-styled the phone number box into a single unified container with the `+91` code inline with a right border, rather than two separate boxes.
- **Why**: Ensures exact layout matching with the user's reference design, which starts directly with the form inputs.

### 19. `apps/customer-web/src/App.tsx` — Modified
- Styled the auth modal backdrop and container to align with the **Turf Theme**.
- Set the overlay bg to a softer transparent color (`bg-[#030712]/60 backdrop-blur-sm`) to keep the turf image visible behind it.
- Styled the modal container card with a semi-transparent glassmorphism look and a glowing green border (`bg-[#030712]/80 border-emerald-500/20 shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]`).
- Styled the method switcher tabs to a dark green/emerald active state.
- **Why**: Matches the auth forms design with the green turf theme.

### 20. `apps/customer-web/src/App.tsx` — Modified
- Enhanced the explore turf card list grid item designs.
- Designed glassmorphism card skins (`bg-[#0f172a]/40 backdrop-blur-xl` in dark mode, `bg-white/90` in light mode) with rounded-3xl corners.
- Programmed a subtle dark hover elevation shadow (`hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)]` / `rgba(16,185,129,0.1)`) that casts a soft emerald/green spotlight underneath the card.
- Standardized image aspect ratios and added gradient overlays.
- **Why**: Responds to user request to enhance the card UI layout to look extremely premium.

### 21. `apps/mobile-app/app/index.tsx` — Modified
- Upgraded the mobile arena card UI.
- Increased card corner radius (`borderRadius: 24`), set backgrounds to a clean dark slate (`#0c1122`), and added shadow elevations.
- Re-styled rating indicators with dynamic transparent backgrounds (`rgba(16,185,129,0.1)`) and added a premium emerald `sportBadge` tag layout.
- **Why**: Standardizes cards look and feel across customer web and mobile workspaces.

### 22. `apps/customer-web/src/App.tsx` — Modified
- Made the login/signup modal background card (`bg-white` / `bg-[#030712]/80`), overlay, switcher tabs, close button, and field labels fully responsive to the `isDarkMode` theme selector state.
- **Why**: Fixes the issue where the login card remained black after switching to the white theme.

### 23. `apps/customer-web/src/components/NearbyMap.tsx` & `App.tsx` — Created | Modified
- Created a fully geofenced Leaflet.js map component displaying local user coordinates and nearby turf venues.
- Configured dynamic theme toggles for Leaflet maps layers (light theme maps vs CartoDB dark maps).
- Programmed range radius sliders with automatic Haversine formula calculation filters, allowing the user to filter turfs by km distance.
- Integrated auth-gated navbar tabs that conditionally show the "📍 Nearby Maps" tab when user is logged in.
- Coded direct booking redirection links: clicking "Book Now" in map popups transitions the user straight to the explore tab, focusing the specific turf details card.
- **Why**: Responds to user request to add geofencing nearby maps on user login.

### 24. `apps/customer-web/src/components/NearbyMap.tsx` & `App.tsx` — Modified
- Added a new mock turf venue 'Camp Nou Arena' (Mumbai - Andheri West) with precise `lat`/`lng` coordinates to the sample data list.
- Programmed a smart distance check fallback in the Geofencing Map: if the user's location is > 120km away from any active turf, it activates a "Demo Mode" centering on Mumbai and showing the available venues to prevent blank list empty states.
- **Why**: Allows users in any location to immediately view and test the interactive map pins.

### 25. `apps/customer-web/src/components/NearbyMap.tsx` & `App.tsx` — Modified
- Relocated all sample turf mock venues (Old Trafford, Lords, Wembley, Camp Nou) to Ahmednagar, Maharashtra by updating their latitude/longitude coordinates and city/area fields.
- Set the default center of the Geofencing Map component to Ahmednagar, Maharashtra `[19.0948, 74.7480]`.
- **Why**: Responds to user request to use Maharashtra, Ahmednagar as the base location for geofenced turfs.

### 26. `apps/owner-web/` — Created
- Designed and initialized a brand-new React 19 + Vite web application under `apps/owner-web` listening on port `3004`.
- Programmed 4 distinct dashboard tabs:
  - **Overview Dashboard**: Displays revenue, active venues, slot fill rate metrics, and custom SVG weekly bar charts.
  - **My Turfs**: Lists owner's active arenas and hosts form to add/edit turf fields (including coordinates and sports).
  - **Slot Manager**: Displays a calendar slot schedule by day of the week, allowing owner to toggle slot availability or block slots for maintenance.
  - **Bookings Log**: Comprehensive table of customer reservations with customer name, phone, slot time, amount, and quick cancel action.
- Styled with a premium dark emerald theme (`#030712`) matching the brand identity of TurfBook.
- **Why**: Responds to user request to create a turf owner panel.

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
| 2026-07-06 | Added Map tab to mobile app using `react-native-maps` with turf markers and bottom detail card |

---

### 27. `apps/mobile-app/app/index.tsx` — Modified
- Added `react-native-maps` dependency to mobile-app package.
- Added a new **Map tab** (🗺️) to the bottom navigation between Bookings and Support.
- Rendered a full-screen `MapView` with custom `⚽` emoji markers for each turf location.
- Tapping a marker shows a `Callout` tooltip with turf name, sport, and price.
- Added a slide-up bottom card (`mapCard`) when a marker is tapped — showing turf name, area, sport badge, rating, price, and a **Book This Turf** CTA that navigates to the Explore tab.
- Map is rendered outside the `ScrollView` so it can fill the full remaining screen height.
- Turf coordinates are placed in Mumbai (Andheri West, Bandra East, Dwarka area) for demo purposes.
- **Why**: User requested a Map tab to show turf locations on an interactive map.

### 28. `apps/mobile-app/app/index.tsx` — Modified
- Synced `mockTurfs` and `turfLocations` arrays with customer web data.
- Updated all 3 existing venues to use Ahmednagar coordinates (matching `NearbyMap.tsx`).
- Renamed "Lords Cricket Indoor" → "Lords Cricket Club" to match customer web.
- Updated all area labels from Mumbai neighbourhoods → Ahmednagar localities (Savedi, Pipeline Road, Kedgaon, Gulmohar Road).
- Added **Camp Nou Arena** as the 4th venue (id: '4', Football, ₹1800/hr) in both Explore cards and Map markers.
- Updated map `initialRegion` to Ahmednagar center `[19.0948, 74.7480]` with tighter zoom (0.12 delta).
- **Why**: Mobile app had stale Mumbai placeholder data; customer web uses Ahmednagar. Synced for consistency.

### 29. `apps/customer-web/src/App.tsx` — Modified
- Removed the `isAuthenticated` auth-gate from the **📍 Nearby Maps** tab in the navbar.
- Removed the `isAuthenticated &&` guard from the `NearbyMap` component render condition.
- Moved the 'nearby' tab between 'bookings' and 'support' in the nav order for better UX.
- **Why**: The Nearby Maps tab was invisible to logged-out users. Now accessible to everyone.
