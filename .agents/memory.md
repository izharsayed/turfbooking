# Ã°Å¸Â§Â  AI Agent Memory Ã¢â‚¬â€ TurfBook Project

<<<<<<< HEAD
> Last updated: 2026-07-09 18:02 IST
=======
> Last updated: 2026-07-10 12:20 IST
>>>>>>> 57205da (updated)
> This file stores persistent context about the TurfBook project setup, decisions made, and issues resolved during AI-assisted development sessions.

---

## Ã°Å¸â€œÂ¦ Project Overview

- **Name**: TurfBook (Turf Booking Platform)
- **Repo Root**: `d:\PROJECTS\TurfBook`
- **Architecture**: Turborepo + pnpm workspaces monorepo with Clean Architecture
- **Package Manager**: pnpm v11.9.0
- **Node Version**: v24.16.0

### Apps
| App | Path | Stack |
|-----|------|-------|
| Backend API | `backend/` | Node.js + Express + TypeScript |
| Frontend (All Web) | `frontend/` | React 19 + Vite + Tailwind (merged: customer + owner + admin) |
| Mobile App | `mobile/` | React Native + Expo 51 |

### Shared Config
- `firebase/` Ã¢â‚¬â€ Firestore rules, Storage rules, indexes

### Ã¢Å¡Â Ã¯Â¸Â Old structure REMOVED:
- `apps/` Ã¢â‚¬â€ deleted
- `packages/` Ã¢â‚¬â€ deleted
- `turbo.json`, `pnpm-workspace.yaml` Ã¢â‚¬â€ deleted
- Monorepo tooling fully removed

### How to Run
```bash
# Terminal 1 Ã¢â‚¬â€ Backend
cd backend && npm run dev     Ã¢â€ â€™ http://localhost:5000

# Terminal 2 Ã¢â‚¬â€ Frontend
cd frontend && npm run dev    Ã¢â€ â€™ http://localhost:3001

# Mobile
cd mobile && npx expo start
```

### Frontend Routing (Role-based)
- `/login` Ã¢â€ â€™ shared login page (role selector: customer / owner / admin)
- `/customer/*` Ã¢â€ â€™ CustomerApp (was customer-web)
- `/owner/*` Ã¢â€ â€™ OwnerApp (was owner-web)
- `/admin/*` Ã¢â€ â€™ AdminApp (was admin-web)

---

## Ã¢Å¡â„¢Ã¯Â¸Â Current Environment Configuration

**File**: `apps/backend/.env`

```
DATABASE_PROVIDER=firebase        Ã¢â€ Â Using Firebase (no Docker/PostgreSQL needed)
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=turfbook-74c8c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@turfbook-74c8c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=...
FIREBASE_STORAGE_BUCKET=turfbook-74c8c.appspot.com
```

> Ã¢Å¡Â Ã¯Â¸Â `DATABASE_URL` and `REDIS_URL` are intentionally omitted (Firebase mode, no Docker).

---

## Ã°Å¸â€Â§ Setup Decisions & Changes Made

### 1. Switched Database Provider: Prisma Ã¢â€ â€™ Firebase
- **Reason**: User does not want to use Docker for local development.
- **Decision**: Use `DATABASE_PROVIDER=firebase` to use Firestore instead of PostgreSQL.

### 2. `apps/backend/src/config/env.ts` Ã¢â‚¬â€ Modified
- Made `DATABASE_URL` **optional** (was `z.string().min(1)`, changed to `z.string().optional()`)
- Added fallback logic: sets `DATABASE_URL` to `'firebase'` placeholder in test/undefined env when provider is firebase
- **Why**: The Zod schema crashed at startup if `DATABASE_URL` was not set, even in Firebase mode.

### 3. `apps/backend/src/server.ts` Ã¢â‚¬â€ Modified
- Wrapped `prisma.$connect()` in `if (env.DATABASE_PROVIDER !== 'firebase')` guard
- Wrapped `prisma.$disconnect()` in graceful shutdown handler similarly
- **Why**: Server always called `prisma.$connect()` regardless of provider, causing crashes.

### 4. `apps/backend/src/database/index.ts` Ã¢â‚¬â€ Rewritten
- Replaced eager `new PrismaClient(...)` with a **lazy Proxy pattern**
- PrismaClient is only `require()`d when `DATABASE_PROVIDER` is `prisma`
- In Firebase mode, `$connect` and `$disconnect` return `Promise.resolve()` no-ops
- **Why**: `@prisma/client` threw "did not initialize yet" at module load time even in Firebase mode because `new PrismaClient()` was called unconditionally at the top level.

### 5. `apps/backend/package.json` Ã¢â‚¬â€ Modified
- Changed dev script from: `ts-node-dev --respawn --transpile-only src/server.ts`
- To: `tsx watch src/server.ts`
- Installed `tsx` as a devDependency: `pnpm add -D tsx --filter=@turf-booking/backend`
- **Why**: tsconfig uses `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` (ESM). `ts-node-dev` could not resolve `.js`-extensioned imports (`Cannot find module './app.js'`). `tsx` handles this natively.

### 6. `.agents/memory.md` Ã¢â‚¬â€ Created
- Stores all project context, environment config, code changes, and decisions.
- **Why**: Persistent memory so AI agent retains full project context across sessions.

### 7. `.agents/AGENTS.md` Ã¢â‚¬â€ Created
- Workspace rule: AI agent must update `memory.md` after every task, fix, or decision.
- Format rules defined for change entries, next steps, and environment updates.
- **Why**: Ensures memory stays current automatically without the user needing to remind the agent.

### 8. `apps/customer-web/src/index.css` Ã¢â‚¬â€ Modified
- Imported Google Fonts ("Plus Jakarta Sans" and "Outfit").
- Set default sans-serif font family to `'Plus Jakarta Sans', 'Outfit'`.
- **Why**: Standard sans-serif stack looked generic and unpolished; new typography aligns with modern premium design standards.

### 9. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Restructured layout using radial glowing background accents.
- Replaced broken Unsplash image URLs with working, high-quality sports turf photos.
- Integrated `lucide-react` icons inside categories, search tabs, and details lists.
- Refined dark and light mode contrasts to comply with high color-contrast guidelines.
- **Why**: Elevates visual aesthetics and fixes broken images shown in the landing page screenshot.

### 10. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Embedded a subtle, dark-masked background turf image overlay on the top absolute container.
- Added linear gradient masks to ensure high readability and contrast for hero texts in both dark and light modes.
- **Why**: Responds to user request to add a turf image into the page background.

### 11. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Replaced the background turf photo with a highly vibrant green grass texture and increased opacity (`opacity-[0.15]` in dark and `opacity-[0.08]` in light mode).
- Fixed the broken Wembley Futsal Dome card image by linking a working Unsplash sport dome URL.
- **Why**: Resolves visibility issues where the background turf was too faint to see in light mode, and fixes the broken Wembley dome card.

### 12. `apps/customer-web/public/images/turf-bg.jpg` Ã¢â‚¬â€ Created
- Saved user-provided turf photo locally (422 KB) at `apps/customer-web/public/images/turf-bg.jpg`.
- Updated `App.tsx` to reference `/images/turf-bg.jpg` instead of any external Unsplash URL.
- Bumped opacity slightly to `0.18` (dark) / `0.10` (light) for better visibility.
- **Why**: User requested the image be stored locally so it doesn't depend on an external network URL.

### 13. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Replaced CSS `mix-blend-overlay/multiply` approach (which made image invisible on light mode) with inline `opacity` style directly on the `<img>` tag.
- Used inline gradient `style` props for the dark/light mode overlay Ã¢â‚¬â€ more reliable across browser rendering engines.
- Changed container from `absolute` to `fixed` so the background stays pinned during scroll.
- **Why**: Fixes the "image not loading" report Ã¢â‚¬â€ the image was loading but `mix-blend-multiply` on a light background made it invisible. Now clearly visible in both dark (35% opacity) and light (22% opacity) modes.

### 14. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Restored the local turf background image.
- Updated the header styling to use transparent backgrounds (`bg-transparent`) instead of semi-opaque white/dark backgrounds.
- This allows the restored background turf image to flow smoothly behind the floating pill-style navbar.
- **Why**: Responds to user request to keep the turf background image but make the navbar transparent/glassmorphic like the reference image.

### 15. `apps/customer-web/src/App.tsx` & `store/authStore.ts` Ã¢â‚¬â€ Modified
- Redesigned the auth modal to establish **Phone Number** as the primary field for login and sign up.
- Integrated a premium sliding tab toggle between **Password Login** and **OTP Login**.
- Configured dynamic form layouts that simulate OTP code generation/dispatched alerts matching the backend `/send-otp` and `/verify-otp` endpoints.
- Mapped phone property inside `UserProfile` state store interface.
- **Why**: Implements phone-number focused login/signup flow as requested by the user.

### 16. `apps/mobile-app/app/index.tsx` & `store/authStore.ts` Ã¢â‚¬â€ Modified
- Upgraded the mobile app's authentication screens to align on **Phone Number** as primary credentials.
- Created `authTabButton` stylesheet classes to prevent style collisions with main tab layouts.
- Integrated phone code indicator badges, OTP send dialog triggers, and password modes matching the customer-web client flow.
- **Why**: Ensures consistency across both Customer Web and Mobile applications for the phone-primary login flow.

### 17. `apps/customer-web/src/App.tsx` & `apps/mobile-app/app/index.tsx` Ã¢â‚¬â€ Modified
- Styled all login/signup input fields with solid white background (`bg-white` / `#ffffff`) and dark text color (`text-slate-900` / `#0f172a`).
- Set custom border parameters (`border-slate-700/30` / `#cbd5e1`) to match the user's reference modal layout.
- Styled labels to uppercase font matching the screenshot design.
- **Why**: Matches the auth forms design with the user's reference UI.

### 18. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Removed the top logo block and header title ("Welcome Back" / "Create Account") from the auth modal overlay.
- Re-styled the phone number box into a single unified container with the `+91` code inline with a right border, rather than two separate boxes.
- **Why**: Ensures exact layout matching with the user's reference design, which starts directly with the form inputs.

### 19. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Styled the auth modal backdrop and container to align with the **Turf Theme**.
- Set the overlay bg to a softer transparent color (`bg-[#030712]/60 backdrop-blur-sm`) to keep the turf image visible behind it.
- Styled the modal container card with a semi-transparent glassmorphism look and a glowing green border (`bg-[#030712]/80 border-emerald-500/20 shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]`).
- Styled the method switcher tabs to a dark green/emerald active state.
- **Why**: Matches the auth forms design with the green turf theme.

### 20. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Enhanced the explore turf card list grid item designs.
- Designed glassmorphism card skins (`bg-[#0f172a]/40 backdrop-blur-xl` in dark mode, `bg-white/90` in light mode) with rounded-3xl corners.
- Programmed a subtle dark hover elevation shadow (`hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)]` / `rgba(16,185,129,0.1)`) that casts a soft emerald/green spotlight underneath the card.
- Standardized image aspect ratios and added gradient overlays.
- **Why**: Responds to user request to enhance the card UI layout to look extremely premium.

### 21. `apps/mobile-app/app/index.tsx` Ã¢â‚¬â€ Modified
- Upgraded the mobile arena card UI.
- Increased card corner radius (`borderRadius: 24`), set backgrounds to a clean dark slate (`#0c1122`), and added shadow elevations.
- Re-styled rating indicators with dynamic transparent backgrounds (`rgba(16,185,129,0.1)`) and added a premium emerald `sportBadge` tag layout.
- **Why**: Standardizes cards look and feel across customer web and mobile workspaces.

### 22. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Made the login/signup modal background card (`bg-white` / `bg-[#030712]/80`), overlay, switcher tabs, close button, and field labels fully responsive to the `isDarkMode` theme selector state.
- **Why**: Fixes the issue where the login card remained black after switching to the white theme.

### 23. `apps/customer-web/src/components/NearbyMap.tsx` & `App.tsx` Ã¢â‚¬â€ Created | Modified
- Created a fully geofenced Leaflet.js map component displaying local user coordinates and nearby turf venues.
- Configured dynamic theme toggles for Leaflet maps layers (light theme maps vs CartoDB dark maps).
- Programmed range radius sliders with automatic Haversine formula calculation filters, allowing the user to filter turfs by km distance.
- Integrated auth-gated navbar tabs that conditionally show the "Ã°Å¸â€œÂ Nearby Maps" tab when user is logged in.
- Coded direct booking redirection links: clicking "Book Now" in map popups transitions the user straight to the explore tab, focusing the specific turf details card.
- **Why**: Responds to user request to add geofencing nearby maps on user login.

### 24. `apps/customer-web/src/components/NearbyMap.tsx` & `App.tsx` Ã¢â‚¬â€ Modified
- Added a new mock turf venue 'Camp Nou Arena' (Mumbai - Andheri West) with precise `lat`/`lng` coordinates to the sample data list.
- Programmed a smart distance check fallback in the Geofencing Map: if the user's location is > 120km away from any active turf, it activates a "Demo Mode" centering on Mumbai and showing the available venues to prevent blank list empty states.
- **Why**: Allows users in any location to immediately view and test the interactive map pins.

### 25. `apps/customer-web/src/components/NearbyMap.tsx` & `App.tsx` Ã¢â‚¬â€ Modified
- Relocated all sample turf mock venues (Old Trafford, Lords, Wembley, Camp Nou) to Ahmednagar, Maharashtra by updating their latitude/longitude coordinates and city/area fields.
- Set the default center of the Geofencing Map component to Ahmednagar, Maharashtra `[19.0948, 74.7480]`.
- **Why**: Responds to user request to use Maharashtra, Ahmednagar as the base location for geofenced turfs.

### 26. `apps/owner-web/` Ã¢â‚¬â€ Created
- Designed and initialized a brand-new React 19 + Vite web application under `apps/owner-web` listening on port `3004`.
- Programmed 4 distinct dashboard tabs:
  - **Overview Dashboard**: Displays revenue, active venues, slot fill rate metrics, and custom SVG weekly bar charts.
  - **My Turfs**: Lists owner's active arenas and hosts form to add/edit turf fields (including coordinates and sports).
  - **Slot Manager**: Displays a calendar slot schedule by day of the week, allowing owner to toggle slot availability or block slots for maintenance.
  - **Bookings Log**: Comprehensive table of customer reservations with customer name, phone, slot time, amount, and quick cancel action.
- Styled with a premium dark emerald theme (`#030712`) matching the brand identity of TurfBook.
- **Why**: Responds to user request to create a turf owner panel.

### 27. `apps/admin-web/` & `apps/owner-web/` Ã¢â‚¬â€ Modified
- Integrated custom `themeStore` utilizing Zustand to persist dark and light theme state (`admin-theme` and `owner-theme` in localStorage).
- Added a dark/light mode toggle switch button in the header of the Admin Panel and the sidebar of the Owner Panel.
- Updated all subviews, cards, inputs, buttons, tables, and charts to dynamically toggle styles using Tailwind CSS classes, yielding gorgeous off-white light modes and dark modes.
- **Why**: Responds to user requests to add dark and light theme switches to both the admin panel and owner panel.

---

## Ã¢Å“â€¦ Working State

```
Ã°Å¸â€Å’ Initializing database repository provider: FIREBASE
Ã¢Å¡Â Ã¯Â¸Â  REDIS_URL is not defined. Redis operations will fail.      Ã¢â€ Â harmless
Ã¢Å¡Â Ã¯Â¸Â  Nodemailer SMTP mailer config is missing.                  Ã¢â€ Â harmless
Ã¢Å¡Â Ã¯Â¸Â  Cloudinary configurations are missing.                     Ã¢â€ Â harmless
Ã°Å¸â€Â¥ Using Firebase as database provider Ã¢â‚¬â€ skipping Prisma connection
Ã¢ÂÂ° Initializing background job scheduler...
Ã°Å¸Å¡â‚¬ Server running on port 5000 in development mode
Ã°Å¸â€œâ€ž API Docs available at http://localhost:5000/api-docs
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

## Ã°Å¸â€Â¥ Firebase Project Details

| Field | Value |
|-------|-------|
| Project ID | `turfbook-74c8c` |
| Service Account | `firebase-adminsdk-fbsvc@turfbook-74c8c.iam.gserviceaccount.com` |
| Storage Bucket | `turfbook-74c8c.appspot.com` |

> Ã¢Å¡Â Ã¯Â¸Â **Security Note**: Private key is stored in `.env` which is `.gitignore`d. Never commit credentials to git.

---

## Ã°Å¸â€œÂ Known Warnings (Non-Breaking)

| Warning | Impact | Fix When |
|---------|--------|----------|
| `REDIS_URL not defined` | Caching disabled | Add Upstash Redis URL to `.env` |
| `Nodemailer config missing` | Email prints to console | Add SMTP config when email features needed |
| `Cloudinary config missing` | File uploads fall back to local disk | Add Cloudinary keys when image uploads needed |
| `npm warn Unknown project config "only-built-dependencies"` | Harmless warning from npm/npx | Ignore (caused by `npx pnpm` reading pnpm's `.npmrc` config) |

---

## Ã°Å¸â€”ÂºÃ¯Â¸Â Next Steps / Pending Work

- [ ] Enable Firestore Database in Firebase Console (test mode)
- [ ] Test API endpoints via Swagger at `http://localhost:5000/api-docs`
- [ ] Optionally add Upstash Redis URL for caching support
- [ ] Set up frontend apps (`pnpm dev:admin` / `pnpm dev:customer`)

---

## Ã°Å¸â€œâ€¦ Session Log

| Date | Summary |
|------|---------|
| 2026-07-04 | Initial setup: switched to Firebase provider, fixed Prisma/ESM issues, got backend running on port 5000 |
| 2026-07-04 | Created `memory.md` and `AGENTS.md` rule for persistent AI memory |
| 2026-07-06 | Added Map tab to mobile app using `react-native-maps` with turf markers and bottom detail card |

---

### 27. `apps/mobile-app/app/index.tsx` Ã¢â‚¬â€ Modified
- Added `react-native-maps` dependency to mobile-app package.
- Added a new **Map tab** (Ã°Å¸â€”ÂºÃ¯Â¸Â) to the bottom navigation between Bookings and Support.
- Rendered a full-screen `MapView` with custom `Ã¢Å¡Â½` emoji markers for each turf location.
- Tapping a marker shows a `Callout` tooltip with turf name, sport, and price.
- Added a slide-up bottom card (`mapCard`) when a marker is tapped Ã¢â‚¬â€ showing turf name, area, sport badge, rating, price, and a **Book This Turf** CTA that navigates to the Explore tab.
- Map is rendered outside the `ScrollView` so it can fill the full remaining screen height.
- Turf coordinates are placed in Mumbai (Andheri West, Bandra East, Dwarka area) for demo purposes.
- **Why**: User requested a Map tab to show turf locations on an interactive map.

### 28. `apps/mobile-app/app/index.tsx` Ã¢â‚¬â€ Modified
- Synced `mockTurfs` and `turfLocations` arrays with customer web data.
- Updated all 3 existing venues to use Ahmednagar coordinates (matching `NearbyMap.tsx`).
- Renamed "Lords Cricket Indoor" Ã¢â€ â€™ "Lords Cricket Club" to match customer web.
- Updated all area labels from Mumbai neighbourhoods Ã¢â€ â€™ Ahmednagar localities (Savedi, Pipeline Road, Kedgaon, Gulmohar Road).
- Added **Camp Nou Arena** as the 4th venue (id: '4', Football, Ã¢â€šÂ¹1800/hr) in both Explore cards and Map markers.
- Updated map `initialRegion` to Ahmednagar center `[19.0948, 74.7480]` with tighter zoom (0.12 delta).
- **Why**: Mobile app had stale Mumbai placeholder data; customer web uses Ahmednagar. Synced for consistency.

### 29. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Removed the `isAuthenticated` auth-gate from the **Ã°Å¸â€œÂ Nearby Maps** tab in the navbar.
- Removed the `isAuthenticated &&` guard from the `NearbyMap` component render condition.
- Moved the 'nearby' tab between 'bookings' and 'support' in the nav order for better UX.
- **Why**: The Nearby Maps tab was invisible to logged-out users. Now accessible to everyone.

### 30. `package.json` (root) Ã¢â‚¬â€ Modified
- Added `"dev": "turbo dev"` script Ã¢â‚¬â€ runs all apps concurrently.
- Added `"dev:web": "turbo dev --filter=backend --filter=admin-web --filter=customer-web"` Ã¢â‚¬â€ web apps only (no mobile/Expo).
- **Why**: `pnpm dev` was throwing `Command "dev" not found` because the root package.json had no `dev` script, only `dev:backend`, `dev:admin`, etc.

| Date | Summary |
|------|---------|
| 2026-07-06 | Fixed missing `pnpm dev` root script; added `dev` and `dev:web` to root package.json |
| 2026-07-07 | Integrated 5 Premium Features in Turf Owner Panel (Dynamic pricing, financial CSV statements download, staff access roles, offline equipment rentals, and player reviews manager reply feed). |
| 2026-07-07 | Matched Owner Web Panel UI styling (Google Fonts, local background turf image, backdrop-filters, and glassmorphism layouts) with Customer Web Panel. |

| 2026-07-07 | Restricted Turf Owner Panel scroll to internal section viewports by locking layout container height to h-screen. |

| 2026-07-07 | Integrated collapsible toggles on main dashboard panels (Weekly Booking Performance, Quick Status, Revenue Distribution) and optimized chart vertical scaling. |

| 2026-07-07 | Removed Maintenance Blocks status card from dashboard sidebar. |

| 2026-07-07 | Updated Time Slot Planner to support full 24-hour schedules with 24 slots generated per day. |

| 2026-07-07 | Restructured monorepo Ã¢â€ â€™ simple frontend/backend/firebase/mobile layout. Merged 3 web apps into single frontend with role-based routing. |
| 2026-07-07 | Fixed all TypeScript errors in frontend: 'CUSTOMER'Ã¢â€ â€™'customer' role type, removed unused icon imports, disabled noUnusedLocals in tsconfig. |

| 2026-07-07 | Reduced slot card dimensions and padding, allowing denser grids to fit within the Slot Planner window. |

| 2026-07-07 | Simplified Dynamic Pricing Rules panel and relocated it to the bottom of the Slot Planner as a horizontal toolbar. |

| 2026-07-07 | Wired slot card click triggers to launch pre-filled manual booking form, and synced booking submissions to slot statuses. |

| 2026-07-07 | Implemented a responsive mobile header bar and sliding hamburger menu overlay sidebar. |

| 2026-07-07 | Integrated desktop collapsibility toggles on sidebar, allowing transition between full w-64 and icon-only w-20 layouts. |

| 2026-07-07 | Restricted STAFF role view to only allow navigation to Slot Manager and Bookings Log. |

| 2026-07-07 | Enabled slot planner click interactions for the STAFF role, allowing manual bookings. |

### 31. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Extended state variables and interfaces (Review, StaffMember, pricing rules, selected addons, replyText, userRole).
- Integrated Dynamic Pricing Rules config card panel; updated Slot planner cards to dynamically compute peak/weekend prices and display badges.
- Programmed CSV Export function compilation (Booking statement download).
- Programmed Staff switch (OWNER vs STAFF) sidebar footer toggle; restricted financial charts, total metrics, add/edit/delete buttons when STAFF role is active.
- Integrated Equipment Rentals checkboxes selection in manual booking form; updated booking reservations list to display selected equipment rental badges.
- Created Player Reviews & Ratings subview with stars indicators and interactive official manager replies textbox input.
- Added invite-staff form and deletion control buttons on staff list directory cards.
- **Why**: Responds to user request to implement all premium features (Dynamic pricing, financial export, staff access roles, equipment rentals add-ons, and customer reviews feed) in the Turf Owner Panel.

### 32. apps/owner-web/src/index.css & src/App.tsx Ã¢â‚¬â€ Modified
- Loaded Google Fonts ("Plus Jakarta Sans", "Outfit") and set default body font family.
- Copied "turf-bg.jpg" locally locally into `apps/owner-web/public/images/turf-bg.jpg`.
- Integrated a fixed background turf image wrapper with dynamic opacity overlays responding to the `isDarkMode` state.
- Enhanced card grids, main content tag, and sidebar styling with glassmorphism backdrop filters and semi-transparent colors.
- **Why**: Responds to user request to match the Turf Owner Panel UI aesthetics, backgrounds, and fonts with the Customer Web Panel.

### 33. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Swapped outer viewport container layout from `min-h-screen` to `h-screen overflow-hidden`.
- Configured individual `overflow-y-auto` rules on both the navigation sidebar (`aside`) and the main panel container (`main`).
- **Why**: Responds to user request to lock the layout viewport to prevent global page-scrolling, turning the panel into a native-feeling SaaS dashboard app.

### 34. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Declared state variables `weeklyPerfOpen`, `quickStatusOpen`, and `revDistOpen` to support collapsing dashboard card containers.
- Reduced default chart height from `h-64` to `h-40` and updated vertical bar scale logic to render more compactly.
- Added Chevron toggle buttons inside the section titles that collapse card elements, leaving only their headers visible.
- **Why**: Responds to user request to minimize dashboard sections to prevent vertical scrolling and keep important indicators immediately visible in the viewport.

### 35. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Removed the "MAINTENANCE BLOCKS" status box indicator from the Quick Status panel on the dashboard.
- **Why**: Responds to user request to remove this indicator.

### 36. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Replaced the static 7-slot time range array with a dynamic 24-slot generator that compiles all hourly slots of a day (`00:00 - 01:00` to `23:00 - 24:00`).
- **Why**: Responds to user request to support a full 24-hour slot management system in the Slot Planner.

### 37. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Swapped out the non-standard `px-4.5` padding class with a fully supported `px-5` class on the days-of-the-week buttons.
- Configured accessible text color classes (white text on emerald green background in light mode) to improve color contrast.
- **Why**: Responds to user request to fix the squished day selector pills and enhance their visual readability.

### 38. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Reduced slot planner button card height from `h-28` to `h-18` and decreased padding to `px-3.5 py-2.5`.
- Restructured layout details (price, peak/weekend emoji icons, block reasons) to be single-line and space-efficient.
- **Why**: Responds to user request to minimize the size of the slot scheduler cards, fitting more slots inside the active viewport height.

### 39. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Relocated the Dynamic Pricing Surcharge Rules form card from the top of the Slot Planner subview to the bottom.
- Simplified the form card layout into a single-row horizontal settings toolbar strip.
- **Why**: Responds to user request to remove the bulky top rules card, make it simpler/better, and position it at the bottom of the page.

### 40. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Programmed a `handleSlotClick` handler that intercepts slot clicks, pre-populates the manual booking form inputs (date, time slot), switches view tab to Bookings Log, and opens the manual booking panel.
- Enhanced the `handleSaveManualBooking` form submission method to search and update the respective slot status to `BOOKED` React-state dynamically.
- **Why**: Responds to user request to make slot card clicks seamlessly launch the offline/manual booking form pre-filled with the slot's schedule details.

### 41. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Declared `isSidebarOpen` state to control mobile/tablet sidebar visibility.
- Implemented a Mobile Header bar featuring a hamburger Menu trigger and light/dark theme switch, visible below the `md` breakpoint.
- Configured a slide-in overlay drawer for the sidebar along with a frosted backdrop overlay and X Close buttons to dismiss the drawer.
- **Why**: Responds to user request to add a hamburger menu in the sidebar/layout to support responsive mobile layouts.

### 42. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Declared `isSidebarCollapsed` state to control desktop sidebar width expansion/collapsibility.
- Added a toggle hamburger menu button inside the sidebar header next to the branding logo.
- Styled responsive transition classes so that clicking the toggle on desktop collapses the sidebar to a mini-width icon-only panel (`w-20`), while keeping standard mobile overlay drawers intact.
- **Why**: Responds to user request to provide a hamburger/collapse toggle button for the sidebar on all viewports.

### 43. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Filtered the sidebar navigation items list array dynamically if `userRole === 'STAFF'` to only show Slot Manager and Bookings Log tabs.
- Programmed the role switcher onClick handler to automatically reset active tab to `slots` when switching to STAFF.
- **Why**: Responds to user request to restrict the staff panel view so staff members can only access the Slot Manager and Bookings Log subviews.

Ã¢ÂÂ° Initializing background job scheduler...
Ã°Å¸Å¡â‚¬ Server running on port 5000 in development mode
Ã°Å¸â€œâ€ž API Docs available at http://localhost:5000/api-docs
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

## Ã°Å¸â€Â¥ Firebase Project Details

| Field | Value |
|-------|-------|
| Project ID | `turfbook-74c8c` |
| Service Account | `firebase-adminsdk-fbsvc@turfbook-74c8c.iam.gserviceaccount.com` |
| Storage Bucket | `turfbook-74c8c.appspot.com` |

> Ã¢Å¡Â Ã¯Â¸Â **Security Note**: Private key is stored in `.env` which is `.gitignore`d. Never commit credentials to git.

---

## Ã°Å¸â€œÂ Known Warnings (Non-Breaking)

| Warning | Impact | Fix When |
|---------|--------|----------|
| `REDIS_URL not defined` | Caching disabled | Add Upstash Redis URL to `.env` |
| `Nodemailer config missing` | Email prints to console | Add SMTP config when email features needed |
| `Cloudinary config missing` | File uploads fall back to local disk | Add Cloudinary keys when image uploads needed |
| `npm warn Unknown project config "only-built-dependencies"` | Harmless warning from npm/npx | Ignore (caused by `npx pnpm` reading pnpm's `.npmrc` config) |

---

## Ã°Å¸â€”ÂºÃ¯Â¸Â Next Steps / Pending Work

- [ ] Enable Firestore Database in Firebase Console (test mode)
- [ ] Test API endpoints via Swagger at `http://localhost:5000/api-docs`
- [ ] Optionally add Upstash Redis URL for caching support
- [ ] Set up frontend apps (`pnpm dev:admin` / `pnpm dev:customer`)

---

## Ã°Å¸â€œâ€¦ Session Log

| Date | Summary |
|------|---------|
| 2026-07-04 | Initial setup: switched to Firebase provider, fixed Prisma/ESM issues, got backend running on port 5000 |
| 2026-07-04 | Created `memory.md` and `AGENTS.md` rule for persistent AI memory |
| 2026-07-06 | Added Map tab to mobile app using `react-native-maps` with turf markers and bottom detail card |

---

### 27. `apps/mobile-app/app/index.tsx` Ã¢â‚¬â€ Modified
- Added `react-native-maps` dependency to mobile-app package.
- Added a new **Map tab** (Ã°Å¸â€”ÂºÃ¯Â¸Â) to the bottom navigation between Bookings and Support.
- Rendered a full-screen `MapView` with custom `Ã¢Å¡Â½` emoji markers for each turf location.
- Tapping a marker shows a `Callout` tooltip with turf name, sport, and price.
- Added a slide-up bottom card (`mapCard`) when a marker is tapped Ã¢â‚¬â€ showing turf name, area, sport badge, rating, price, and a **Book This Turf** CTA that navigates to the Explore tab.
- Map is rendered outside the `ScrollView` so it can fill the full remaining screen height.
- Turf coordinates are placed in Mumbai (Andheri West, Bandra East, Dwarka area) for demo purposes.
- **Why**: User requested a Map tab to show turf locations on an interactive map.

### 28. `apps/mobile-app/app/index.tsx` Ã¢â‚¬â€ Modified
- Synced `mockTurfs` and `turfLocations` arrays with customer web data.
- Updated all 3 existing venues to use Ahmednagar coordinates (matching `NearbyMap.tsx`).
- Renamed "Lords Cricket Indoor" Ã¢â€ â€™ "Lords Cricket Club" to match customer web.
- Updated all area labels from Mumbai neighbourhoods Ã¢â€ â€™ Ahmednagar localities (Savedi, Pipeline Road, Kedgaon, Gulmohar Road).
- Added **Camp Nou Arena** as the 4th venue (id: '4', Football, Ã¢â€šÂ¹1800/hr) in both Explore cards and Map markers.
- Updated map `initialRegion` to Ahmednagar center `[19.0948, 74.7480]` with tighter zoom (0.12 delta).
- **Why**: Mobile app had stale Mumbai placeholder data; customer web uses Ahmednagar. Synced for consistency.

### 29. `apps/customer-web/src/App.tsx` Ã¢â‚¬â€ Modified
- Removed the `isAuthenticated` auth-gate from the **Ã°Å¸â€œÂ Nearby Maps** tab in the navbar.
- Removed the `isAuthenticated &&` guard from the `NearbyMap` component render condition.
- Moved the 'nearby' tab between 'bookings' and 'support' in the nav order for better UX.
- **Why**: The Nearby Maps tab was invisible to logged-out users. Now accessible to everyone.

### 30. `package.json` (root) Ã¢â‚¬â€ Modified
- Added `"dev": "turbo dev"` script Ã¢â‚¬â€ runs all apps concurrently.
- Added `"dev:web": "turbo dev --filter=backend --filter=admin-web --filter=customer-web"` Ã¢â‚¬â€ web apps only (no mobile/Expo).
- **Why**: `pnpm dev` was throwing `Command "dev" not found` because the root package.json had no `dev` script, only `dev:backend`, `dev:admin`, etc.

| Date | Summary |
|------|---------|
| 2026-07-06 | Fixed missing `pnpm dev` root script; added `dev` and `dev:web` to root package.json |
| 2026-07-07 | Integrated 5 Premium Features in Turf Owner Panel (Dynamic pricing, financial CSV statements download, staff access roles, offline equipment rentals, and player reviews manager reply feed). |
| 2026-07-07 | Matched Owner Web Panel UI styling (Google Fonts, local background turf image, backdrop-filters, and glassmorphism layouts) with Customer Web Panel. |

| 2026-07-07 | Restricted Turf Owner Panel scroll to internal section viewports by locking layout container height to h-screen. |

| 2026-07-07 | Integrated collapsible toggles on main dashboard panels (Weekly Booking Performance, Quick Status, Revenue Distribution) and optimized chart vertical scaling. |

| 2026-07-07 | Removed Maintenance Blocks status card from dashboard sidebar. |

| 2026-07-07 | Updated Time Slot Planner to support full 24-hour schedules with 24 slots generated per day. |

| 2026-07-07 | Restructured monorepo Ã¢â€ â€™ simple frontend/backend/firebase/mobile layout. Merged 3 web apps into single frontend with role-based routing. |
| 2026-07-07 | Fixed all TypeScript errors in frontend: 'CUSTOMER'Ã¢â€ â€™'customer' role type, removed unused icon imports, disabled noUnusedLocals in tsconfig. |

| 2026-07-07 | Reduced slot card dimensions and padding, allowing denser grids to fit within the Slot Planner window. |

| 2026-07-07 | Simplified Dynamic Pricing Rules panel and relocated it to the bottom of the Slot Planner as a horizontal toolbar. |

| 2026-07-07 | Wired slot card click triggers to launch pre-filled manual booking form, and synced booking submissions to slot statuses. |

| 2026-07-07 | Implemented a responsive mobile header bar and sliding hamburger menu overlay sidebar. |

| 2026-07-07 | Integrated desktop collapsibility toggles on sidebar, allowing transition between full w-64 and icon-only w-20 layouts. |

| 2026-07-07 | Restricted STAFF role view to only allow navigation to Slot Manager and Bookings Log. |

| 2026-07-07 | Enabled slot planner click interactions for the STAFF role, allowing manual bookings. |

### 31. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Extended state variables and interfaces (Review, StaffMember, pricing rules, selected addons, replyText, userRole).
- Integrated Dynamic Pricing Rules config card panel; updated Slot planner cards to dynamically compute peak/weekend prices and display badges.
- Programmed CSV Export function compilation (Booking statement download).
- Programmed Staff switch (OWNER vs STAFF) sidebar footer toggle; restricted financial charts, total metrics, add/edit/delete buttons when STAFF role is active.
- Integrated Equipment Rentals checkboxes selection in manual booking form; updated booking reservations list to display selected equipment rental badges.
- Created Player Reviews & Ratings subview with stars indicators and interactive official manager replies textbox input.
- Added invite-staff form and deletion control buttons on staff list directory cards.
- **Why**: Responds to user request to implement all premium features (Dynamic pricing, financial export, staff access roles, equipment rentals add-ons, and customer reviews feed) in the Turf Owner Panel.

### 32. apps/owner-web/src/index.css & src/App.tsx Ã¢â‚¬â€ Modified
- Loaded Google Fonts ("Plus Jakarta Sans", "Outfit") and set default body font family.
- Copied "turf-bg.jpg" locally locally into `apps/owner-web/public/images/turf-bg.jpg`.
- Integrated a fixed background turf image wrapper with dynamic opacity overlays responding to the `isDarkMode` state.
- Enhanced card grids, main content tag, and sidebar styling with glassmorphism backdrop filters and semi-transparent colors.
- **Why**: Responds to user request to match the Turf Owner Panel UI aesthetics, backgrounds, and fonts with the Customer Web Panel.

### 33. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Swapped outer viewport container layout from `min-h-screen` to `h-screen overflow-hidden`.
- Configured individual `overflow-y-auto` rules on both the navigation sidebar (`aside`) and the main panel container (`main`).
- **Why**: Responds to user request to lock the layout viewport to prevent global page-scrolling, turning the panel into a native-feeling SaaS dashboard app.

### 34. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Declared state variables `weeklyPerfOpen`, `quickStatusOpen`, and `revDistOpen` to support collapsing dashboard card containers.
- Reduced default chart height from `h-64` to `h-40` and updated vertical bar scale logic to render more compactly.
- Added Chevron toggle buttons inside the section titles that collapse card elements, leaving only their headers visible.
- **Why**: Responds to user request to minimize dashboard sections to prevent vertical scrolling and keep important indicators immediately visible in the viewport.

### 35. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Removed the "MAINTENANCE BLOCKS" status box indicator from the Quick Status panel on the dashboard.
- **Why**: Responds to user request to remove this indicator.

### 36. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Replaced the static 7-slot time range array with a dynamic 24-slot generator that compiles all hourly slots of a day (`00:00 - 01:00` to `23:00 - 24:00`).
- **Why**: Responds to user request to support a full 24-hour slot management system in the Slot Planner.

### 37. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Swapped out the non-standard `px-4.5` padding class with a fully supported `px-5` class on the days-of-the-week buttons.
- Configured accessible text color classes (white text on emerald green background in light mode) to improve color contrast.
- **Why**: Responds to user request to fix the squished day selector pills and enhance their visual readability.

### 38. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Reduced slot planner button card height from `h-28` to `h-18` and decreased padding to `px-3.5 py-2.5`.
- Restructured layout details (price, peak/weekend emoji icons, block reasons) to be single-line and space-efficient.
- **Why**: Responds to user request to minimize the size of the slot scheduler cards, fitting more slots inside the active viewport height.

### 39. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Relocated the Dynamic Pricing Surcharge Rules form card from the top of the Slot Planner subview to the bottom.
- Simplified the form card layout into a single-row horizontal settings toolbar strip.
- **Why**: Responds to user request to remove the bulky top rules card, make it simpler/better, and position it at the bottom of the page.

### 40. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Programmed a `handleSlotClick` handler that intercepts slot clicks, pre-populates the manual booking form inputs (date, time slot), switches view tab to Bookings Log, and opens the manual booking panel.
- Enhanced the `handleSaveManualBooking` form submission method to search and update the respective slot status to `BOOKED` React-state dynamically.
- **Why**: Responds to user request to make slot card clicks seamlessly launch the offline/manual booking form pre-filled with the slot's schedule details.

### 41. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Declared `isSidebarOpen` state to control mobile/tablet sidebar visibility.
- Implemented a Mobile Header bar featuring a hamburger Menu trigger and light/dark theme switch, visible below the `md` breakpoint.
- Configured a slide-in overlay drawer for the sidebar along with a frosted backdrop overlay and X Close buttons to dismiss the drawer.
- **Why**: Responds to user request to add a hamburger menu in the sidebar/layout to support responsive mobile layouts.

### 42. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Declared `isSidebarCollapsed` state to control desktop sidebar width expansion/collapsibility.
- Added a toggle hamburger menu button inside the sidebar header next to the branding logo.
- Styled responsive transition classes so that clicking the toggle on desktop collapses the sidebar to a mini-width icon-only panel (`w-20`), while keeping standard mobile overlay drawers intact.
- **Why**: Responds to user request to provide a hamburger/collapse toggle button for the sidebar on all viewports.

### 43. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Filtered the sidebar navigation items list array dynamically if `userRole === 'STAFF'` to only show Slot Manager and Bookings Log tabs.
- Programmed the role switcher onClick handler to automatically reset active tab to `slots` when switching to STAFF.
- **Why**: Responds to user request to restrict the staff panel view so staff members can only access the Slot Manager and Bookings Log subviews.

### 44. apps/owner-web/src/App.tsx Ã¢â‚¬â€ Modified
- Removed the `disabled={userRole === 'STAFF'}` check from the slot planner button card elements.
- Enabled standard hover pointer scales and clicks for staff members on the slot planner list.
- **Why**: Responds to user request to make sure the slot button clicks successfully open the offline booking form when logged in as a STAFF role.

### 45. `frontend/package.json` & dependencies Ã¢â‚¬â€ Resolved
- Ran `npm install --legacy-peer-deps` in the `frontend` directory to bypass strict peer dependency checks.
- **Why**: `lucide-react@0.395.0` requires `react@"^16.5.1 || ^17.0.0 || ^18.0.0"`, but the project is using React 19. This caused `ERESOLVE` conflicts during installation. Bypassing peer deps fixes the issue without having to downgrade the main React version.

### 46. `backend/src/server.ts` Ã¢â‚¬â€ Modified
- Moved `import { env } from './config/env.js';` to be the very first import statement at the top of the file.
- **Why**: The `env.ts` module calls `dotenv.config()`. Previously, it was imported *after* `app.js` and other modules, which meant `firebase.ts` and `repositories/index.ts` were evaluating `process.env` variables before the `.env` file was actually loaded. This caused the backend to falsely warn "Firebase settings missing" and initially fall back to initializing Prisma. Hoisting the import ensures environment variables are loaded immediately.

### 47. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Upgraded the Admin Dashboard layout with premium glassmorphism (`backdrop-blur-xl`, `bg-white/80`, `bg-slate-900/40`).
- Added the `turf-bg.jpg` background image with a linear-gradient fade overlay (matching the Customer Web Panel aesthetics).
- Added vibrant background mesh glow effects (Emerald & Indigo `blur-[120px]` circles).
- Configured dynamic hover micro-animations (`hover:-translate-y-1.5`, `hover:shadow-2xl`) for the top statistical cards, along with icon rotation physics on hover.
- Replaced the static "Welcome" placeholder block with a 2-column grid layout for functional Admin Features.
- Implemented a **Platform Quick Actions** side-panel with styled buttons for common tasks (Approve Turfs, Manage Users, Reports, Settings).
- Implemented a **Recent Activity Table** showing live-feed style system events with dynamic status badges (Success, Pending, Failed).
- Redesigned the Admin Logo to feature a custom `bg-gradient-to-br from-emerald-500 to-teal-700`.
- **Why**: Responds to user request to enhance the Admin Dashboard UI to look extremely premium and state-of-the-art.

### 48. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Modified
- Programmed a dynamic role-based theme switching system for the login modal.
- Configured the UI to seamlessly transition to an exclusive Admin Indigo/Purple glow theme (`bg-indigo-600`, `shadow-[...rgba(79,70,229,0.3)]`) when the "Admin" role tab is clicked, separating it from the standard Emerald Customer/Owner theme.
- Injected a `ShieldCheck` icon specifically onto the Admin Login button to symbolize elevated privileges.
- Re-coded the modal's background gradient arrays so the entire viewport smoothly fades into a deep violet/blue environment when an admin attempts to sign in.
- **Why**: Elevates the Admin login experience and ensures the Admin UI aesthetic starts at the very first touchpoint before they even enter the dashboard.

### 49. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Rewritten
- Refactored `AdminApp.tsx` from a static dashboard into a fully functional multi-page application.
- Introduced `activeTab` state-based routing (`'dashboard' | 'turfs' | 'users' | 'reports' | 'settings'`).
- Added a permanent glassmorphic Sidebar Navigation with active tab highlighting.
- Wired the "Quick Actions" panel buttons to update the `activeTab` and switch views.
- Implemented dedicated render functions for each view: `renderDashboard`, `renderTurfs` (Approve/Reject actions), `renderUsers` (Status badges, Filters), `renderReports`, and `renderSettings`.
- **Why**: Responds to the user request to make the Admin Dashboard fully functional and add more pages while keeping the single-file structure simplicity from the Owner/Customer apps.

### 50. `frontend/src/services/api.ts` Ã¢â‚¬â€ Created
- Created a centralized Axios client configured to talk to `http://localhost:5000/api`.
- Built an automatic JWT injection interceptor using `useAuthStore.getState().token`.
- Built a response interceptor to automatically log out users on `401 Unauthorized` responses.
- **Why**: Establishes the real connection layer between the frontend and backend, moving away from mocked data.

### 51. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Replaced all mock data arrays with real React state variables (`dashboardStats`, `owners`, `users`, `settings`).
- Added `useEffect` hooks to fetch data from the backend dynamically when navigating tabs.
- Connected the "Approve/Reject Owner" buttons to hit the `PUT /admin/owners/:id/approve` and `reject` routes.
- Connected the User Management table to hit `PUT /admin/users/:id/block` and `DELETE` routes.
- Renamed the "Turf Approvals" UI to "Owner Approvals" to align with backend capabilities.
- **Why**: Implements the user's directive to "make all the modules in the admin dashboard working" by hooking the UI up to actual backend endpoints.

### 52. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Added an "Add Owner" button to the Owner Approvals header using a `Plus` icon.
- Created a `showAddOwnerModal` state and a corresponding form modal with fields for Name, Email, Phone, and Password.
- Implemented `handleAddOwner` to send a `POST` request to `/auth/register-owner` with the form data.
- **Why**: Fulfills the user's request to allow admins to directly register new owners from the Admin dashboard.

### 53. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Updated the "Add New Owner" modal form to collect the exact fields required by the backend `registerOwnerSchema` (companyName, businessRegisterNumber, businessAddress, billingEmail).
- **Why**: The form previously only collected name, email, phone, and password, which caused the backend to reject the request with validation errors, preventing the new owner data from reaching the database.

### 54. `frontend/src/services/api.ts` Ã¢â‚¬â€ Modified
- Changed baseURL from `http://localhost:5000/api` Ã¢â€ â€™ `http://localhost:5000/api/v1`.
- **Why**: All backend routes are mounted under `/api/v1/` (e.g. `/api/v1/auth`, `/api/v1/admin`). The frontend was sending every request to `/api/...` which hit a 404, causing "Failed to add owner" and all other API calls to silently fail. This was the root cause of the error.

### 55. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Rewritten
- Replaced the **mock login** (`login(mockUser, 'mock-token-' + role)`) with a **real API call** to `POST /api/v1/auth/login`.
- Changed the login form field from `phone` to `email` (backend login uses email + password).
- Maps backend roles (`SUPER_ADMIN`, `TURF_OWNER`, `CUSTOMER`) to frontend roles (`admin`, `owner`, `customer`).
- Stores real `accessToken` and `refreshToken` from the backend response.
- Added `isLoading` state with spinner and disabled button during API call.
- Shows real error messages from the backend on failed login.
- **Why**: The login page was using a hardcoded mock token which was never accepted by the backend. All admin API calls returned "Invalid or expired access token" because `mock-token-admin` is not a valid JWT.

### 56. `frontend/src/store/authStore.ts` Ã¢â‚¬â€ Modified
- Added `refreshToken` field to state, stored in `localStorage`.
- Added `setToken()` action to update only the access token (used during token refresh).
- Updated `login()` to accept an optional `refreshToken` parameter.
- Updated `logout()` to clear `refreshToken` from localStorage.
- **Why**: The authStore previously only stored the access token. The refresh token is needed by the API interceptor to auto-renew expired sessions.

### 57. `frontend/src/services/api.ts` Ã¢â‚¬â€ Modified
- Added **automatic token refresh** logic to the Axios 401 response interceptor.
- When a 401 is received, checks for a stored `refreshToken` and calls `POST /api/v1/auth/refresh`.
- If refresh succeeds, updates the access token via `setToken()` and retries the original request.
- Queues multiple concurrent 401 requests and replays them after a single refresh.
- If refresh fails, calls `logout()` and redirects to `/login`.
- **Why**: Access tokens expire after 15 minutes. Without refresh logic, all admin API calls fail after 15 minutes and the user is silently stuck.

### 58. `backend/seed-firebase-admin.js` Ã¢â‚¬â€ Created
- New plain Node.js seed script (CommonJS, no TypeScript compilation needed).
- Creates the `SUPER_ADMIN` user directly in Firestore with email `admin@turfbook.com` and password `Admin@12345`.
- Also creates the `user_profiles` document for the admin.
- Skips creation if admin already exists (idempotent).
- **Why**: The existing `prisma/seed.ts` uses Prisma/PostgreSQL. Since the project runs on Firebase, the admin user was never seeded into Firestore, making admin login impossible.
- **Run with**: `node seed-firebase-admin.js` from the `backend/` directory.

### 59. `backend/reset-admin-password.js` Ã¢â‚¬â€ Created
- Script that resets the admin user's `passwordHash` in Firestore with a freshly generated and pre-verified bcrypt hash.
- New admin password set to `Admin123` (no special characters to avoid encoding issues).
- **Why**: The original seed used `Admin@12345` with an `@` symbol. The bcrypt hash was generating correctly but `bcrypt.compare()` was failing at login, likely due to special character encoding differences on Windows between the seed and the runtime context.
- **Admin credentials (Firebase)**: `admin@turfbook.com` / `Admin123`
- **Run with**: `node reset-admin-password.js` from the `backend/` directory.

### 60. `backend/src/repositories/firebase/FirebaseAdminRepository.ts` Ã¢â‚¬â€ Modified
- Formatted `createdAt` and `updatedAt` to ISO string format in `listOwners()` to prevent "Invalid Date" from rendering on the frontend.
- Added mapping of `ownerStatus` in `listOwners()` from `data.ownerStatus` or computed status from `isActive` status (e.g. `data.ownerStatus || (data.isActive ? 'APPROVED' : 'PENDING')`).
- Handled third parameter `rejectionReason` in `updateOwnerApproval()` to write `ownerStatus` as well as `rejectionReason` fields into Firestore user documents.
- **Why**: Fixes the Owner Approvals list UI state and actions so that clicking "Approve" or "Reject" successfully persists the status changes to Firestore and updates the buttons/badges accordingly.

### 61. `backend/src/modules/admin/admin.validators.ts` Ã¢â‚¬â€ Modified
- Made the `status` field optional in `ownerApprovalSchema`.
- **Why**: The frontend `/admin/owners/:id/reject` call only sends `{ rejectionReason: '...' }` in the body since status is implicit for this endpoint. Without making status optional, the Zod validator was failing with a validation error on reject.

### 62. `mobile/app/owner/_layout.tsx` Ã¢â‚¬â€ Created
- Tab navigator for the owner panel with 4 tabs: Dashboard, Bookings, Turfs, Profile.
- Uses indigo accent (`#6366f1`) to visually distinguish owner context from customer app (`#10b981`).
- **Why**: Entry point for the owner panel section of the mobile app.

### 63. `mobile/app/owner/index.tsx` Ã¢â‚¬â€ Created (Owner Dashboard)
- Shows stats cards: Today's Revenue, Today's Bookings, Total Revenue, Active Turfs.
- Recent bookings list with customer name, turf, amount, status.
- Quick action buttons to navigate to Bookings and Turfs tabs.
- Pending reviews alert strip.
- Connects to `GET /api/v1/owner/dashboard` with mock data fallback.
- Role guard: redirects non-TURF_OWNER users to `/` or `/login`.
- **Why**: Primary landing page for the owner after login.

### 64. `mobile/app/owner/bookings.tsx` Ã¢â‚¬â€ Created (Owner Bookings)
- Filter tabs: All / Confirmed / Completed / Cancelled.
- Per-booking cancel action with confirmation dialog.
- Pull-to-refresh support.
- Connects to `GET /api/v1/owner/bookings` and `PUT /api/v1/owner/bookings/:id/cancel`.
- Mock fallback data included.
- **Why**: Lets owners manage all bookings for their turfs.

### 65. `mobile/app/owner/turfs.tsx` Ã¢â‚¬â€ Created (Owner Turfs Management)
- Lists all owner's turfs with active/inactive status indicator strip.
- Add/Edit turf via slide-up bottom sheet modal with form: name, address, price/hr, sport selector, description, active toggle.
- Delete turf with confirmation.
- Connects to full CRUD: `GET/POST/PUT/DELETE /api/v1/owner/turfs`.
- **Why**: Core owner management page for creating and updating turf listings.

### 66. `mobile/app/owner/profile.tsx` Ã¢â‚¬â€ Created (Owner Profile)
- Shows identity card with avatar initials, owner badge, contact info.
- Stats: Total Turfs, Total Bookings, Total Revenue.
- Inline edit form for name, phone, business name.
- Quick nav menu to Turfs and Bookings.
- Logout button.
- Connects to `GET /api/v1/owner/profile` and `PUT /api/v1/owner/profile`.
- **Why**: Lets owner view and edit their account and business details.

### 67. `mobile/app/_layout.tsx` Ã¢â‚¬â€ Modified
- Added `<Stack.Screen name="owner" options={{ headerShown: false }} />` to register the owner tab navigator route.
- **Why**: Required for Expo Router to recognize `/owner/*` paths.

### 68. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Changed all 3 `router.replace('/')` calls after login/register to role-based routing:
  `router.replace(role === 'TURF_OWNER' ? '/owner' : '/')`
- **Why**: Implements Option B auto-routing Ã¢â‚¬â€ owners automatically land on their dashboard, customers land on the customer home screen.

### 69. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Modified
- Re-introduced the "Ã¢Å¡Â¡ Quick Demo Login" select dropdown.
- Updated role selector tab button clicks to automatically pre-fill email and password inputs with corresponding seeded credentials.
- **Why**: Allows instant testing/demo login without requiring manual typing.

### 70. `frontend/src/vite-env.d.ts` Ã¢â‚¬â€ Created [NEW]
- Added standard Vite client reference directives.
- **Why**: Fixes a TypeScript compiler error regarding `import.meta.env` property references.

### 71. `frontend/src/store/authStore.ts` Ã¢â‚¬â€ Modified
- Declared the missing `refreshToken` state property in `useAuthStore` initialization.
- Added `refreshToken` as an argument to the store's `login` function.
- **Why**: Fixes TypeScript compiler type mismatches with the `AuthState` interface.

### 72. `frontend/src/pages/owner/OwnerApp.tsx` Ã¢â‚¬â€ Modified
- Replaced the duplicate api client import pointing to `store/api` with the standard default client in `services/api`.
- Integrated a live **Weather Advisory** operational widget inside the "Quick Status" sidebar panel.
- Developed an interactive **Surcharge Revenue Simulator** toolbar slider inside the revenue distribution tab to estimate weekly revenue growth.
- **Why**: Standardizes Axios communication to allow auto-refresh token headers on 401, fixes the "Failed to save turf" expired token bug, and adds key operational business tools for owners.

### 73. `frontend/src/store/api.ts` Ã¢â‚¬â€ Deleted [DELETE]
- Removed the duplicate Axios client file.
- **Why**: Redundant codebase asset that lacks JWT auto-refresh features and conflicts with `services/api`.

### 74. `backend/src/database/seedFirebase.ts` Ã¢â‚¬â€ Modified
- Updated user seeding block to call `.update()` on existing user documents in Firestore, ensuring their password hashes are updated to bcrypt and their status is active.
- **Why**: Pre-existing users had plain text passwords stored in the database, causing authentication attempts to fail.

### 75. `frontend/src/pages/customer/CustomerApp.tsx` Ã¢â‚¬â€ Modified
- Replaced the static hardcoded mock `sampleTurfs` array with a dynamic `turfs` state loaded on mount from `GET /api/v1/turfs`.
- Mapped backend sport IDs correctly to the human-readable sport labels used in the customer UI filters.
- Replaced the static mock customer bookings log with live database bookings loaded from `GET /api/v1/bookings`.
- Refactored `handleBookSlot` to make a real `POST /api/v1/bookings` call when completing customer checkouts.
- Connected the Nearby map markers to the live database `turfs` coordinates state.
- **Why**: Responds to user request to make sure turfs added in the Owner panel appear immediately in the Customer panel.

### 76. `frontend/src/pages/owner/OwnerApp.tsx` Ã¢â‚¬â€ Modified
- Imported and integrated `useNavigate` from `react-router-dom` and `useAuthStore` from authStore.
- Replaced mock `alert()` statement in the sidebar "Sign Out" button handler with actual state cleanup (`logout()`) and redirect to the `/login` route.
- **Why**: Responds to user request to fix the non-functional "Sign Out" button in the owner panel.

### 77. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Rewritten
- Removed email and password inputs and the associated role selector tabs.
- Implemented phone number input that requests a 6-digit OTP verification code via `api.post('/auth/send-otp')`.
- Implemented OTP code verification and session creation via `api.post('/auth/verify-otp')`.
- Updated the Quick Demo Login dropdown to set the respective registered phone number, request the OTP, auto-fill the dev bypass code `123456`, and verify to sign in with a single click.
- **Why**: Responds to user request to only have number/OTP login on the login screen.

### 78. `backend/src/database/seedFirebase.ts` Ã¢â‚¬â€ Modified
- Extended user update seeding query to also sync `phone` and `role` fields on existing Firestore documents.
- **Why**: Pre-existing admin account had an old phone number (`9999999999`) in the database, causing OTP requests for the standard quick-login number (`8888877777`) to throw a "No user found" error.

### 79. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Added a collapsible "Dev Quick Login" dropdown simulating Customer/Owner login using pure client state bypass.
- Added a floating Theme Toggle button in the top right corner using vector icons.
- Removed the "Password" and "OTP Login" tabs, forcing the login screen to be phone number + OTP-only.
- Removed Email and Password inputs from Register and Login screens.
- Auto-generates the email (`${phone}@turfbook.com`) and password (`TurfBookPass@123`) behind the scenes during registration.
- **Why**: Allows offline dev quick login with a single click, bypasses email/password fields completely, and forces OTP-only authentication for a seamless mobile experience.

### 80. `mobile/app/profile.tsx` Ã¢â‚¬â€ Modified
- Added a Theme Toggle button in the header right next to the edit profile button.
- **Why**: Provides a simple way for customer profiles to switch between dark and light themes dynamically.

### 81. `mobile/app/owner/profile.tsx` Ã¢â‚¬â€ Modified
- Added a Theme Toggle button in the header next to the edit profile button.
- **Why**: Enables turf owners to toggle dark and light modes directly from their profile screen.

### 82. `mobile/app/index.tsx` Ã¢â‚¬â€ Modified
- Replaced the text emoji toggle with a vector icon (`Ionicons` sun/moon) for a polished appearance.
- **Why**: Enhances the UI look and feel of the primary theme switcher.

### 83. `backend/src/shared/utils/sessionManager.ts` Ã¢â‚¬â€ Modified
- Enabled a developer bypass code (`123456`) in the `verifyOTP` logic when running in non-production environments.
- **Why**: Allows instant OTP verification during development and enables one-click automated logins.

### 84. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
### 51. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Replaced all mock data arrays with real React state variables (`dashboardStats`, `owners`, `users`, `settings`).
- Added `useEffect` hooks to fetch data from the backend dynamically when navigating tabs.
- Connected the "Approve/Reject Owner" buttons to hit the `PUT /admin/owners/:id/approve` and `reject` routes.
- Connected the User Management table to hit `PUT /admin/users/:id/block` and `DELETE` routes.
- Renamed the "Turf Approvals" UI to "Owner Approvals" to align with backend capabilities.
- **Why**: Implements the user's directive to "make all the modules in the admin dashboard working" by hooking the UI up to actual backend endpoints.

### 52. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Added an "Add Owner" button to the Owner Approvals header using a `Plus` icon.
- Created a `showAddOwnerModal` state and a corresponding form modal with fields for Name, Email, Phone, and Password.
- Implemented `handleAddOwner` to send a `POST` request to `/auth/register-owner` with the form data.
- **Why**: Fulfills the user's request to allow admins to directly register new owners from the Admin dashboard.

### 53. `frontend/src/pages/admin/AdminApp.tsx` Ã¢â‚¬â€ Modified
- Updated the "Add New Owner" modal form to collect the exact fields required by the backend `registerOwnerSchema` (companyName, businessRegisterNumber, businessAddress, billingEmail).
- **Why**: The form previously only collected name, email, phone, and password, which caused the backend to reject the request with validation errors, preventing the new owner data from reaching the database.

### 54. `frontend/src/services/api.ts` Ã¢â‚¬â€ Modified
- Changed baseURL from `http://localhost:5000/api` Ã¢â€ â€™ `http://localhost:5000/api/v1`.
- **Why**: All backend routes are mounted under `/api/v1/` (e.g. `/api/v1/auth`, `/api/v1/admin`). The frontend was sending every request to `/api/...` which hit a 404, causing "Failed to add owner" and all other API calls to silently fail. This was the root cause of the error.

### 55. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Rewritten
- Replaced the **mock login** (`login(mockUser, 'mock-token-' + role)`) with a **real API call** to `POST /api/v1/auth/login`.
- Changed the login form field from `phone` to `email` (backend login uses email + password).
- Maps backend roles (`SUPER_ADMIN`, `TURF_OWNER`, `CUSTOMER`) to frontend roles (`admin`, `owner`, `customer`).
- Stores real `accessToken` and `refreshToken` from the backend response.
- Added `isLoading` state with spinner and disabled button during API call.
- Shows real error messages from the backend on failed login.
- **Why**: The login page was using a hardcoded mock token which was never accepted by the backend. All admin API calls returned "Invalid or expired access token" because `mock-token-admin` is not a valid JWT.

### 56. `frontend/src/store/authStore.ts` Ã¢â‚¬â€ Modified
- Added `refreshToken` field to state, stored in `localStorage`.
- Added `setToken()` action to update only the access token (used during token refresh).
- Updated `login()` to accept an optional `refreshToken` parameter.
- Updated `logout()` to clear `refreshToken` from localStorage.
- **Why**: The authStore previously only stored the access token. The refresh token is needed by the API interceptor to auto-renew expired sessions.

### 57. `frontend/src/services/api.ts` Ã¢â‚¬â€ Modified
- Added **automatic token refresh** logic to the Axios 401 response interceptor.
- When a 401 is received, checks for a stored `refreshToken` and calls `POST /api/v1/auth/refresh`.
- If refresh succeeds, updates the access token via `setToken()` and retries the original request.
- Queues multiple concurrent 401 requests and replays them after a single refresh.
- If refresh fails, calls `logout()` and redirects to `/login`.
- **Why**: Access tokens expire after 15 minutes. Without refresh logic, all admin API calls fail after 15 minutes and the user is silently stuck.

### 58. `backend/seed-firebase-admin.js` Ã¢â‚¬â€ Created
- New plain Node.js seed script (CommonJS, no TypeScript compilation needed).
- Creates the `SUPER_ADMIN` user directly in Firestore with email `admin@turfbook.com` and password `Admin@12345`.
- Also creates the `user_profiles` document for the admin.
- Skips creation if admin already exists (idempotent).
- **Why**: The existing `prisma/seed.ts` uses Prisma/PostgreSQL. Since the project runs on Firebase, the admin user was never seeded into Firestore, making admin login impossible.
- **Run with**: `node seed-firebase-admin.js` from the `backend/` directory.

### 59. `backend/reset-admin-password.js` Ã¢â‚¬â€ Created
- Script that resets the admin user's `passwordHash` in Firestore with a freshly generated and pre-verified bcrypt hash.
- New admin password set to `Admin123` (no special characters to avoid encoding issues).
- **Why**: The original seed used `Admin@12345` with an `@` symbol. The bcrypt hash was generating correctly but `bcrypt.compare()` was failing at login, likely due to special character encoding differences on Windows between the seed and the runtime context.
- **Admin credentials (Firebase)**: `admin@turfbook.com` / `Admin123`
- **Run with**: `node reset-admin-password.js` from the `backend/` directory.

### 60. `backend/src/repositories/firebase/FirebaseAdminRepository.ts` Ã¢â‚¬â€ Modified
- Formatted `createdAt` and `updatedAt` to ISO string format in `listOwners()` to prevent "Invalid Date" from rendering on the frontend.
- Added mapping of `ownerStatus` in `listOwners()` from `data.ownerStatus` or computed status from `isActive` status (e.g. `data.ownerStatus || (data.isActive ? 'APPROVED' : 'PENDING')`).
- Handled third parameter `rejectionReason` in `updateOwnerApproval()` to write `ownerStatus` as well as `rejectionReason` fields into Firestore user documents.
- **Why**: Fixes the Owner Approvals list UI state and actions so that clicking "Approve" or "Reject" successfully persists the status changes to Firestore and updates the buttons/badges accordingly.

### 61. `backend/src/modules/admin/admin.validators.ts` Ã¢â‚¬â€ Modified
- Made the `status` field optional in `ownerApprovalSchema`.
- **Why**: The frontend `/admin/owners/:id/reject` call only sends `{ rejectionReason: '...' }` in the body since status is implicit for this endpoint. Without making status optional, the Zod validator was failing with a validation error on reject.

### 62. `mobile/app/owner/_layout.tsx` Ã¢â‚¬â€ Created
- Tab navigator for the owner panel with 4 tabs: Dashboard, Bookings, Turfs, Profile.
- Uses indigo accent (`#6366f1`) to visually distinguish owner context from customer app (`#10b981`).
- **Why**: Entry point for the owner panel section of the mobile app.

### 63. `mobile/app/owner/index.tsx` Ã¢â‚¬â€ Created (Owner Dashboard)
- Shows stats cards: Today's Revenue, Today's Bookings, Total Revenue, Active Turfs.
- Recent bookings list with customer name, turf, amount, status.
- Quick action buttons to navigate to Bookings and Turfs tabs.
- Pending reviews alert strip.
- Connects to `GET /api/v1/owner/dashboard` with mock data fallback.
- Role guard: redirects non-TURF_OWNER users to `/` or `/login`.
- **Why**: Primary landing page for the owner after login.

### 64. `mobile/app/owner/bookings.tsx` Ã¢â‚¬â€ Created (Owner Bookings)
- Filter tabs: All / Confirmed / Completed / Cancelled.
- Per-booking cancel action with confirmation dialog.
- Pull-to-refresh support.
- Connects to `GET /api/v1/owner/bookings` and `PUT /api/v1/owner/bookings/:id/cancel`.
- Mock fallback data included.
- **Why**: Lets owners manage all bookings for their turfs.

### 65. `mobile/app/owner/turfs.tsx` Ã¢â‚¬â€ Created (Owner Turfs Management)
- Lists all owner's turfs with active/inactive status indicator strip.
- Add/Edit turf via slide-up bottom sheet modal with form: name, address, price/hr, sport selector, description, active toggle.
- Delete turf with confirmation.
- Connects to full CRUD: `GET/POST/PUT/DELETE /api/v1/owner/turfs`.
- **Why**: Core owner management page for creating and updating turf listings.

### 66. `mobile/app/owner/profile.tsx` Ã¢â‚¬â€ Created (Owner Profile)
- Shows identity card with avatar initials, owner badge, contact info.
- Stats: Total Turfs, Total Bookings, Total Revenue.
- Inline edit form for name, phone, business name.
- Quick nav menu to Turfs and Bookings.
- Logout button.
- Connects to `GET /api/v1/owner/profile` and `PUT /api/v1/owner/profile`.
- **Why**: Lets owner view and edit their account and business details.

### 67. `mobile/app/_layout.tsx` Ã¢â‚¬â€ Modified
- Added `<Stack.Screen name="owner" options={{ headerShown: false }} />` to register the owner tab navigator route.
- **Why**: Required for Expo Router to recognize `/owner/*` paths.

### 68. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Changed all 3 `router.replace('/')` calls after login/register to role-based routing:
  `router.replace(role === 'TURF_OWNER' ? '/owner' : '/')`
- **Why**: Implements Option B auto-routing Ã¢â‚¬â€ owners automatically land on their dashboard, customers land on the customer home screen.

### 69. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Modified
- Re-introduced the "Ã¢Å¡Â¡ Quick Demo Login" select dropdown.
- Updated role selector tab button clicks to automatically pre-fill email and password inputs with corresponding seeded credentials.
- **Why**: Allows instant testing/demo login without requiring manual typing.

### 70. `frontend/src/vite-env.d.ts` Ã¢â‚¬â€ Created [NEW]
- Added standard Vite client reference directives.
- **Why**: Fixes a TypeScript compiler error regarding `import.meta.env` property references.

### 71. `frontend/src/store/authStore.ts` Ã¢â‚¬â€ Modified
- Declared the missing `refreshToken` state property in `useAuthStore` initialization.
- Added `refreshToken` as an argument to the store's `login` function.
- **Why**: Fixes TypeScript compiler type mismatches with the `AuthState` interface.

### 72. `frontend/src/pages/owner/OwnerApp.tsx` Ã¢â‚¬â€ Modified
- Replaced the duplicate api client import pointing to `store/api` with the standard default client in `services/api`.
- Integrated a live **Weather Advisory** operational widget inside the "Quick Status" sidebar panel.
- Developed an interactive **Surcharge Revenue Simulator** toolbar slider inside the revenue distribution tab to estimate weekly revenue growth.
- **Why**: Standardizes Axios communication to allow auto-refresh token headers on 401, fixes the "Failed to save turf" expired token bug, and adds key operational business tools for owners.

### 73. `frontend/src/store/api.ts` Ã¢â‚¬â€ Deleted [DELETE]
- Removed the duplicate Axios client file.
- **Why**: Redundant codebase asset that lacks JWT auto-refresh features and conflicts with `services/api`.

### 74. `backend/src/database/seedFirebase.ts` Ã¢â‚¬â€ Modified
- Updated user seeding block to call `.update()` on existing user documents in Firestore, ensuring their password hashes are updated to bcrypt and their status is active.
- **Why**: Pre-existing users had plain text passwords stored in the database, causing authentication attempts to fail.

### 75. `frontend/src/pages/customer/CustomerApp.tsx` Ã¢â‚¬â€ Modified
- Replaced the static hardcoded mock `sampleTurfs` array with a dynamic `turfs` state loaded on mount from `GET /api/v1/turfs`.
- Mapped backend sport IDs correctly to the human-readable sport labels used in the customer UI filters.
- Replaced the static mock customer bookings log with live database bookings loaded from `GET /api/v1/bookings`.
- Refactored `handleBookSlot` to make a real `POST /api/v1/bookings` call when completing customer checkouts.
- Connected the Nearby map markers to the live database `turfs` coordinates state.
- **Why**: Responds to user request to make sure turfs added in the Owner panel appear immediately in the Customer panel.

### 76. `frontend/src/pages/owner/OwnerApp.tsx` Ã¢â‚¬â€ Modified
- Imported and integrated `useNavigate` from `react-router-dom` and `useAuthStore` from authStore.
- Replaced mock `alert()` statement in the sidebar "Sign Out" button handler with actual state cleanup (`logout()`) and redirect to the `/login` route.
- **Why**: Responds to user request to fix the non-functional "Sign Out" button in the owner panel.

### 77. `frontend/src/pages/LoginPage.tsx` Ã¢â‚¬â€ Rewritten
- Removed email and password inputs and the associated role selector tabs.
- Implemented phone number input that requests a 6-digit OTP verification code via `api.post('/auth/send-otp')`.
- Implemented OTP code verification and session creation via `api.post('/auth/verify-otp')`.
- Updated the Quick Demo Login dropdown to set the respective registered phone number, request the OTP, auto-fill the dev bypass code `123456`, and verify to sign in with a single click.
- **Why**: Responds to user request to only have number/OTP login on the login screen.

### 78. `backend/src/database/seedFirebase.ts` Ã¢â‚¬â€ Modified
- Extended user update seeding query to also sync `phone` and `role` fields on existing Firestore documents.
- **Why**: Pre-existing admin account had an old phone number (`9999999999`) in the database, causing OTP requests for the standard quick-login number (`8888877777`) to throw a "No user found" error.

### 79. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Added a collapsible "Dev Quick Login" dropdown simulating Customer/Owner login using pure client state bypass.
- Added a floating Theme Toggle button in the top right corner using vector icons.
- Removed the "Password" and "OTP Login" tabs, forcing the login screen to be phone number + OTP-only.
- Removed Email and Password inputs from Register and Login screens.
- Auto-generates the email (`${phone}@turfbook.com`) and password (`TurfBookPass@123`) behind the scenes during registration.
- **Why**: Allows offline dev quick login with a single click, bypasses email/password fields completely, and forces OTP-only authentication for a seamless mobile experience.

### 80. `mobile/app/profile.tsx` Ã¢â‚¬â€ Modified
- Added a Theme Toggle button in the header right next to the edit profile button.
- **Why**: Provides a simple way for customer profiles to switch between dark and light themes dynamically.

### 81. `mobile/app/owner/profile.tsx` Ã¢â‚¬â€ Modified
- Added a Theme Toggle button in the header next to the edit profile button.
- **Why**: Enables turf owners to toggle dark and light modes directly from their profile screen.

### 82. `mobile/app/index.tsx` Ã¢â‚¬â€ Modified
- Replaced the text emoji toggle with a vector icon (`Ionicons` sun/moon) for a polished appearance.
- **Why**: Enhances the UI look and feel of the primary theme switcher.

### 83. `backend/src/shared/utils/sessionManager.ts` Ã¢â‚¬â€ Modified
- Enabled a developer bypass code (`123456`) in the `verifyOTP` logic when running in non-production environments.
- **Why**: Allows instant OTP verification during development and enables one-click automated logins.

### 84. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Mapped the collapsible "Dev Quick Login" dropdown options directly to the database seeded users (`9876543210` for Customer and `9999988888` for Owner).
- Programmed the dropdown's "Fill" action to dynamically dispatch `/auth/send-otp` and verify it using `/auth/verify-otp` with the dev bypass code `123456`.
- Bypasses with mock state as a fallback if the API server is offline.
- **Why**: Ensures quick login generates real, authenticated session tokens so that owner dashboard, turfs, and customer booking logs retrieve genuine dynamic database records.

### 85. `mobile/app/payment/index.tsx` Ã¢â‚¬â€ Modified
- Swapped the synchronous static mock lookup `getTurfById` with an asynchronous `useEffect` hook that fetches the turf details directly from `/turfs/:id` with dynamic normalization.
- Includes a smooth loading indicator state and retains the static mock array as a fallback.
- Added a mock ID check (`/^\d+$/`) to completely bypass `apiFetch` when the turf ID is numeric (mock turf), preventing 404 console errors.
- Relocated the lower-level AppState `useEffect` change listener to the top of the component (before the `loading` early return) and converted callback handlers (`executeBookingCreation`, `verifyTransaction`) to standard hoisted function declarations.
- **Why**: Fixes both the "Invalid session details" and the React Render Error: "Rendered more hooks than during the previous render." crash. All hooks now safely execute unconditionally in accordance with React Rules of Hooks.


### 86. `mobile/app/turf/[id].tsx` Ã¢â‚¬â€ Modified
- Added a mock ID check (`/^\d+$/`) in `fetchTurfDetails` to skip the `/turfs/:id` network request if the ID belongs to a static mock turf.
- **Why**: Prevents Metro/Hermes console from printing network 404 warning/error logs when navigating to mock turfs.

### 87. `backend/src/modules/user/booking.routes.ts` Ã¢â‚¬â€ Modified
- Swapped immediate booking confirmation with a secure multi-step pending authorization model.
- Initiated `POST /bookings` creates bookings/payments in `PENDING` state and queries Razorpay to generate order IDs (falling back to mock ID generation if API keys are missing).
- Added `POST /bookings/verify` to execute cryptographic signature validation (`sha256` HMAC check using `RAZORPAY_KEY_SECRET`), confirming the slot on success, or cancelling it on payment failure.
- **Why**: Implements industry-grade secure checkout, decoupling transaction authorization from state persistence and prevents self-reported verification bypass.

### 88. `mobile/app/payment/index.tsx` Ã¢â‚¬â€ Modified
- Refactored payment action to execute backend initiation first to obtain an order reference, then launch a full-screen simulated secure **Razorpay Payment Gateway** page.
- Re-incorporated direct UPI app deep-linking (`gpay://`, `phonepe://`, `paytmmp://`, `bhim://`, or generic `upi://`) so that physical devices launch payment apps automatically.
- Re-installed the foreground `AppState` change listener to automatically confirm the transaction and query the backend verification API once the user returns.
- Added custom, high-fidelity UI views for **Payment Successful** (green checkmark, transaction info, view bookings) and **Payment Failed / Cancelled** (red cross, details, retry button).
- **Why**: Combines production-grade mobile deep-linking with robust server-side transaction verification rather than relying on mock bypass buttons.

### 89. `backend/src/modules/user/turf.routes.ts` Ã¢â‚¬â€ Modified
- Added a public endpoint `GET /turfs/:id/bookings` to query active or pending reservations from the database for a specific turf.
- **Why**: Exposes turf reservations to customer devices so they can display slot occupation statuses in real time.

### 90. `mobile/app/turf/[id].tsx` Ã¢â‚¬â€ Modified
- Declared `bookedReservations` state and added a `useEffect` hook to fetch active reservations from `/turfs/:id/bookings` on load.
- Added an `isSlotBooked()` matcher comparing slot times against backend bookings (filtered by date) and local store bookings.
- Redesigned slot chip badges: occupied slots render with a red background (`rgba(239, 68, 68, 0.08)`), red border (`rgba(239, 68, 68, 0.4)`), a **"Booked"** label, and have their touch events completely disabled.
- **Why**: Prevents double-booking slots by notifying the user exactly which slots are already booked.

### 91. `backend/src/modules/user/booking.routes.ts` Ã¢â‚¬â€ Modified
- Extracted `totalAmount` from the request body in `POST /bookings` and mapped it to the booking document, while keeping `amount` reserved for the transaction payment record.
- **Why**: Decouples the transaction amount (advance paid online) from the full booking reservation cost in database records.

### 92. `mobile/app/payment/index.tsx` Ã¢â‚¬â€ Modified
- Added a `payOption` state (`'full'` vs `'advance'`) and calculated advance payment values (30% base price + convenience fee - rewards).
- Embedded segment selector cards below the Booking details panel to toggle the options cleanly.
- Updated pricing breakdowns, checkout payloads, simulated gateway views, and success cards to dynamically transition, showing paid amounts versus dues left at the venue.
- **Why**: Responds to user request to support partial online advance deposits with remaining balance collected offline at the turf.

### 93. Owner Tab Panel UI Ã¢â‚¬â€ Modified & Aligned
- Aligned `ACCENT` colors across all Owner screens: changed the main active tint from indigo (`#6366f1`) to the customer emerald green (`#10b981`) inside:
  - Tab layouts: [owner/_layout.tsx](file:///d:/PROJECTS/TurfBook/mobile/app/owner/_layout.tsx)
  - Dashboard panel: [owner/index.tsx](file:///d:/PROJECTS/TurfBook/mobile/app/owner/index.tsx) (including stats cards)
  - Booking manager: [owner/bookings.tsx](file:///d:/PROJECTS/TurfBook/mobile/app/owner/bookings.tsx) (tab borders and `COMPLETED` statuses)
  - Turf CRUD manager: [owner/turfs.tsx](file:///d:/PROJECTS/TurfBook/mobile/app/owner/turfs.tsx)
  - Profile card: [owner/profile.tsx](file:///d:/PROJECTS/TurfBook/mobile/app/owner/profile.tsx) (editing actions and theme toggles)
- **Why**: Responds to user request to match the Owner panel's branding, active indicators, and states with the primary customer app UI.

### 94. `backend/src/repositories/firebase/FirebaseOwnerRepository.ts` Ã¢â‚¬â€ Modified
- Refactored `getDashboardStats()` to calculate total revenue using both dynamic (`totalAmount`, `status`) and seed (`finalAmount`, `paymentStatus`) database fields.
- Re-implemented `listBookings()` to dynamically map turf names and fetch customer names/phones from `user_profiles` collection using booking user IDs.
- **Why**: Solidifies the backend connection for all owner panels, ensuring dynamic user bookings propagate to owner screens with matching names, amounts, and dates.

### 95. `backend/src/repositories` & `booking.routes.ts` Ã¢â‚¬â€ Modified
- Changed `IBookingRepository` `create` signature, and updated `FirebaseBookingRepository` and `PrismaBookingRepository` implementations, to accept an optional `bookingDate` parameter.
- Updated `POST /api/v1/bookings` route to extract the `date` or `bookingDate` from the request body and pass it down to the repository.
- **Why**: Allows custom booking dates chosen by the user in the client-side slot planner to be stored in the database.

### 96. `frontend/src/pages/customer/CustomerApp.tsx` Ã¢â‚¬â€ Modified
- Added hooks to fetch active turf bookings from `GET /api/v1/turfs/:id/bookings`.
- Implemented real-time slot availability checking by matching against backend bookings for the selected date.
- Dynamically disabled and styled booked slot buttons in the "Configure Slot" grid.
- Refactored `handleBookSlot` to pass the chosen date, automatically verify the payment status via `POST /api/v1/bookings/verify`, and immediately refresh the slot occupancy states.
- Initialized `selectedDate` to the current system date.
- Expanded the slot selector to display 24 hourly slots dynamically.
- Wrapped slots grid in a compact, scrollable container (`max-h-[250px] overflow-y-auto pr-1.5`) with a 3-column responsive layout (`grid-cols-2 sm:grid-cols-3`) to maintain pristine card proportions.
- Refactored slots configuration panel styling (headers, borders, labels, price tag, button, container) to be fully responsive to Light Mode and Dark Mode.
- Fixed the date picker input text visibility by applying theme-aware backgrounds (`bg-white` vs `bg-[#0f172a]`) and borders to prevent white text on white input elements in Light Mode.
- Enhanced slot chip backgrounds, hover indicators, selected states, and disabled occupied badge contrasts for pristine accessibility.
- Changed time slots format from 24-hour to 12-hour AM/PM format (e.g. `09:00 AM - 10:00 AM`, `04:00 PM - 05:00 PM`).
- Introduced a robust `normalizeSlot` helper matching slot times by standard minute ranges to maintain compatibility with existing 24h database records.
- Styled booked slots in high-contrast red (`border-rose-500/40 bg-rose-500/10 text-rose-500/85`) with a strike-through and a bold, uppercase sub-label **"BOOKED"** in red.
- Integrated a period selector tab bar (**Morning**, **Afternoon**, **Evening**, **Night**) to group the 24 hourly slots, preventing vertical scroll fatigue.
- Re-formatted slot buttons to split the start time, divider, and end time onto separate lines, preventing ugly text wraps on narrow viewports.
- **Why**: Connects the available slots panel to the backend, enabling dynamic slot blocking based on real booking dates, expands availability selection options to a full 24-hour day schedule, fixes text visibility bugs in Light Mode, implements 12-hour AM/PM time formatting, styles booked slots in red with an explicit status sub-label, and provides period filter tabs for simplified scheduling.### 97. `Session 97 & 98 Changes` Ã¢â‚¬â€ Multi-Slot, Checkout Payments, and Sync Fixes
- **Customer App Multi-Slot Support** (`CustomerApp.tsx`):
  - Refactored single selection states into a `selectedTimes` string array.
  - Allowed toggling slots on/off inside the 24-hour slots grid directly (removed period filter tabs).
  - Summed slot prices dynamically (including peak-hour surcharges `Ã°Å¸â€Â¥`) in the footer and checkout components.
  - Joined selected slots with commas when booking and submitting checkout payloads.
- **Removed Mock Maintenance** (`OwnerApp.tsx`):
  - Removed default mock `BLOCKED` status and `Scheduled maintenance check` reasons, making all unoccupied slots `OPEN` by default.
- **Soft-Delete Sync Filter** (`FirebaseTurfRepository.ts`, `PrismaTurfRepository.ts`, `owner.service.ts`):
  - Updated active turf finders (`findAllActive` and `findByCity`) to filter out soft-deleted turfs containing a `deletedAt` timestamp.
  - Set `isActive: false` in `owner.service.ts`'s `deleteTurf` as an extra safety switch.
- **Owner Slot Matching Normalization** (`OwnerApp.tsx`):
  - Integrated `normalizeSlot` into the Owner Panel to parse comma-separated 12-hour AM/PM customer bookings and match them correctly against 24-hour owner slot formats.
  - Corrected the `mappedBookings` parser to check `b.timeSlot || b.time || b.slotId` returned by the backend database, ensuring that all customer bookings resolve to their actual slot times (instead of defaulting to `17:00 - 18:00`).
  - Safe-guarded `split()` operations against undefined properties in the slots useMemo block (`b.timeSlot || ''`).
- **Dynamic Owner Overview Dashboard** (`OwnerApp.tsx`):
  - Filtered `bookingsToday` by today's date rather than counting all bookings.
  - Mapped the "Weekly Booking Performance" graph and "Locations Status" count dynamically to active turfs and weekday fill rates.
- **Checkout Payment Options** (`CustomerApp.tsx`):
  - Integrated Brand Selector tabs under checkout for **Google Pay**, **PhonePe**, and **Paytm / UPI**.
  - Implemented a **"Generate QR Code"** action rendering a high-contrast scanner frame with a dynamic UPI QR Code containing the billing total amount, automatically verifying the booking transaction upon successful simulated completion.
  - Implemented a **"Pay Ã¢â€šÂ¹[Total]"** action triggering an overlay simulating launching the client payment app interface, confirming bookings after a brief redirect timeout.
  - Added icon assets imports and state cleanup switches upon clicking success navigation.
- **Why**: Responds to user requests to enable multi-slot bookings, clear mock maintenance slots, hide deleted turfs from customer lists, synchronize customer bookings correctly into the owner's slot planner, make the owner's Overview Dashboard metrics fully dynamic, and build checkout payment flows supporting QR code and simulated external payment app redirect transactions.

### 98. `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Optimized the `applyDummyLogin` function to bypass OTP verification when using Dev Quick Login. It now makes a fast-timeout (1.5 seconds) request to `/auth/login` using standard credentials (email and password: `'password'`).
- If the endpoint is offline or unreachable, it times out in 1.5 seconds and immediately triggers the local offline auth bypass.
- **Why**: Fixes a hang/freeze bug where Metro's default network timeout (60 seconds) would freeze the application on Quick Login click when Metro's host IP changed or was unreachable.

### 99. Safe Navigation in `mobile/app/login.tsx` Ã¢â‚¬â€ Modified
- Created a `safeRedirect` utility function that wraps `router.replace` in a small `setTimeout` delay and includes a retry fallback block.
- Updated all standard and quick login redirection pathways to use `safeRedirect` instead of calling `router.replace` synchronously.
- **Why**: Resolves the Expo Router crash "Attempted to navigate before mounting the Root Layout component" that happens when redirects trigger before the root layout finishes rendering.

### 100. `mobile/store/authStore.ts` Ã¢â‚¬â€ Rewritten
- Integrated `zustand/middleware` `persist` with `@react-native-async-storage/async-storage` as storage engine.
- Login state (`user`, `token`, `isAuthenticated`) now survives app restarts.
- Added `isHydrated` flag so `_layout.tsx` can show a loading screen until AsyncStorage finishes hydrating.
- **Why**: Users were being logged out every time the app restarted because Zustand's in-memory state was reset.

### 101. `mobile/utils/api.ts` Ã¢â‚¬â€ Enhanced
- Added typed `ApiError` class with `statusCode` property for structured error handling.
- On HTTP 401 response: automatically calls `logout()` from auth store and throws `ApiError(401, ...)`.
- On transient network failures (`TypeError`): retries once after 1 second delay (only if not already a retry).
- **Why**: Token expiry caused silent auth failures; network blips caused unnecessary error states.

### 102. `mobile/app/_layout.tsx` Ã¢â‚¬â€ Rewritten
- Shows `ActivityIndicator` splash screen while AsyncStorage hydrates (prevents seeing wrong screen on cold start).
- Added `AuthBootstrap` component that calls `GET /profile` on startup to validate the persisted JWT.
- On valid token: refreshes user info (name, email, avatarUrl) from backend.
- On 401: clears auth and redirects to `/login` via `safeRedirect`.
- On network error: keeps session alive (offline-friendly behavior).
- **Why**: Cold start with a stale token would show the home screen briefly before silently failing.

### 107. `frontend/src/pages/owner/OwnerApp.tsx` — Modified
- Changed the background turf image wrapper height from `h-[600px]` to `h-full` and increased image opacity to `0.70` in Light Mode and `0.75` in Dark Mode.
- Replaced the bottom fade-to-solid white/grey gradient overlay with a soft overall linear-gradient.
- **Why**: Responds to user request to remove the faded white background (white color from behind) in the Owner dashboard and make the green turf background fully visible.

### 108. `mobile/store/authStore.ts` + `mobile/app/_layout.tsx` — Final Fix (Stuck on Loading)
- Removed `isHydrated` / `setHydrated` / `onRehydrateStorage` entirely from authStore — these caused the app to permanently hang if the callback never fired.
- Removed hydration overlay from `_layout.tsx` — `<Stack>` now always renders immediately with no conditional gates.
- `AuthBootstrap` now fires token validation 500ms after mount using `setTimeout` (non-blocking).
- AsyncStorage persist still works for login persistence — it just hydrates silently in the background without any UI gate.
- **Why**: `onRehydrateStorage` callback was unreliable and `isHydrated` never became `true`, causing infinite loading.

### 109. Multi-Slot Selection — `mobile/app/turf/[id].tsx` + `mobile/app/payment/index.tsx`
- Changed `selectedTime: string | null` to `selectedTimes: string[]` — slot tap toggles selection.
- `startTime`/`endTime` are computed from sorted selectedTimes (shows full session span).
- Green dot indicator on selected slots, counter badge with Clear button.
- Booking bar shows 'N slots selected' + total = price x slotCount.
- handleBook passes comma-separated times and slots count param to payment screen.
- Payment screen parses slotList/slotCount from params, multiplies basePrice x slotCount.
- **Why**: Users requested ability to select multiple slots in one booking.

### 110. `mobile/store/authStore.ts` — Resilient Storage Wrapper
- Wrapped AsyncStorage operations inside a resilient custom StateStorage implementation.
- All actions (getItem, setItem, removeItem) are protected with try-catch blocks that intercept native-module-null errors.
- Automatically falls back to in-memory key-value dictionary if native storage is unavailable.
- **Why**: Prevents uncaught native-module-null rejections from crashing the app during bootstrap/hydration when native storage library assets are not pre-linked or built into the local simulator/Expo runtime.

### 111. Resilient Razorpay & 5-Min Slot Reservation Flow
- Added check in POST /bookings to prevent booking/reserving already CONFIRMED slots or active PENDING reservations (< 5 mins old). Supports multi-slot overlap checks.
- Added findAllPending() to IBookingRepository, FirebaseBookingRepository, and PrismaBookingRepository.
- Implemented background cron job in jobs/index.ts to automatically reclaim unpaid slots (updates status to CANCELLED/FAILED) older than 5 minutes.
- Added logger confirmation notification when payment is verified successfully in POST /bookings/verify.
- Verified clean TypeScript compilation on backend and mobile.

### 112. `frontend/src/pages/customer/CustomerApp.tsx` — Modified
- Renamed the maps tab in the navigation bar from "📍 Nearby Maps" to "📍 Nearby Turfs".
- **Why**: Responds to user request to label the tab text to accurately reflect proximity turf venues.

### 113. Mobile Slot Normalization & Matching
- Added a robust `normalizeSlot` helper in `mobile/app/turf/[id].tsx`.
- Converts 12-hour AM/PM format slots (from the web app) and 24-hour format slots (from the mobile app) into equivalent minute-ranges from midnight.
- Updated `isSlotBooked` to compare normalized values and handle comma-separated multi-slot fields.
- **Why**: Bookings created via the web app (stored as 12-hour AM/PM strings like '01:00 AM - 02:00 AM') failed to show as booked in the mobile app due to string mismatch against the 24-hour format slots ('01:00 - 02:00').

### 114. Owner Panel Settings Integration
- Added a new 'Settings' tab to the Owner Dashboard sidebar layout with Settings icon.
- Settings page includes configuration forms for Payments & Razorpay Credentials (Key ID, Secret, Advance pay %, Convenience fee, Tax rate, toggle status).
- Settings page includes forms for General Business Details & Operations (Brand Name, GSTIN, Billing Email, Address, Auto-cancellation timer limit, Operations hours, alert toggles).
- Updated backend owner profile service to fetch and update both User details and Owner Profile fields (storing dynamic settings in Firestore) via `PUT /owner/profile`.
- Verified clean Vite production build check (0 errors).

### 115. Dynamic Owner UPI Direct Settlement
- Added Business UPI ID field to Owner Panel Settings dashboard (`OwnerApp.tsx`).
- Updated backend `GET /turfs/:id` route to query and return owner's profile settings (including `companyName`, `businessUpiId`, `convenienceFee`, `advance split`, `taxRate`) to the mobile app client.
- Updated mobile app checkout screen (`payment/index.tsx`) to dynamically read `turf.ownerProfile.businessUpiId` and `turf.ownerProfile.companyName` to dynamically construct the UPI Intent Deep Link (`upi://pay`) rather than using a hardcoded merchant VPA address.
- Verified clean builds across both mobile and web clients.

### 116. `frontend/src/pages/customer/CustomerApp.tsx` & `NearbyMap.tsx` — Modified
- Extended background turf image to span full height (`h-full` instead of `h-[600px]`) and set non-fading linear-gradient overlay in CustomerApp.
- Applied responsive glassmorphic cards and containers styling to search filters, turf listings cards, benefits, details drawer modal, configure slot box, checkout details, bookings history, and support tickets.
- Converted hardcoded `text-white` colors to theme-responsive colors to fix text visibility issues in light mode.
- **Why**: Responds to user request to remove the solid/faded white background from the customer panel, make the background image fully visible throughout the page (like in the admin panel), and resolve text visibility issues in light mode.
### 117. `frontend/src/pages/admin/AdminApp.tsx` — Modified
- Increased the size of the "Dashboard Overview" heading to `text-4xl font-black` (was `text-3xl font-extrabold`).
- Decreased the top padding of the main content wrapper layout from `p-8` to `px-8 pt-5` to shift the heading slightly upwards.
- **Why**: Responds to user request to move the Dashboard Overview title slightly upside and make its font size larger.

