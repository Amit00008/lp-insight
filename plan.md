# LP Portal — Implementation Plan

## Overview
An internal admin portal for an accelerator managing multiple small VC funds. Fund managers/admins can log in to review all fund performance, drill into individual positions, and see markups/markdowns over time. Built entirely in Next.js (App Router) with Drizzle ORM + Neon PostgreSQL. Light, clean UI using Shadcn/ui and Recharts.

---

## User Choices
- **Auth**: Simple email/password with JWT in httpOnly cookies
- **Seed Data**: Minimal (1-2 funds, 3-4 companies) — user adds real data later
- **Theme**: Light theme, clean & minimal
- **Access**: Admin-only view (internal accelerator use)

---

## Tech Stack (all in `/workspace/frontend`)
- **Framework**: Next.js 16 (App Router)
- **ORM**: Drizzle ORM → Neon PostgreSQL (`app_cmobwv5y`)
- **UI**: Shadcn/ui, Tailwind CSS, Recharts
- **Auth**: JWT (jose library) in httpOnly cookies, bcryptjs for password hashing
- **Validation**: Zod
- **Database**: Neon PostgreSQL (already provisioned)

---

## TODO 1: Database Schema & Drizzle Setup in Next.js

### Goal
Set up Drizzle ORM inside the Next.js frontend project (NOT the backend). Create all database tables, migration config, and a seed script.

### Files to Create/Modify

#### `frontend/drizzle.config.ts`
- Drizzle Kit config pointing to `db/schema.ts`, dialect `postgresql`, credentials from `DATABASE_URL`.

#### `frontend/db/index.ts`
- Neon serverless client + Drizzle instance export. Reads `DATABASE_URL` from env.

#### `frontend/db/schema.ts`
Tables:

1. **`users`** — Admin/fund manager accounts
   - `id` (uuid, PK, default gen)
   - `email` (varchar 255, unique, not null)
   - `password_hash` (varchar 255, not null)
   - `name` (varchar 255, not null)
   - `role` (varchar 50, default `'admin'`) — for future LP role expansion
   - `created_at` (timestamp, default now)
   - `updated_at` (timestamp, default now)

2. **`funds`** — VC fund entities
   - `id` (uuid, PK, default gen)
   - `name` (varchar 255, not null)
   - `description` (text)
   - `vintage_year` (integer, not null) — year fund was established
   - `target_size` (numeric 15,2) — target fund size in USD
   - `total_committed` (numeric 15,2) — total capital committed
   - `total_called` (numeric 15,2) — total capital called
   - `total_distributed` (numeric 15,2, default 0) — distributions to LPs
   - `status` (varchar 50, default `'active'`) — active | closed | fundraising
   - `created_at` / `updated_at` timestamps

3. **`positions`** — Individual portfolio company investments
   - `id` (uuid, PK, default gen)
   - `fund_id` (uuid, FK → funds.id, not null)
   - `company_name` (varchar 255, not null)
   - `sector` (varchar 100) — e.g. fintech, healthtech, SaaS
   - `stage` (varchar 50) — seed, series-a, series-b, etc.
   - `initial_investment` (numeric 15,2, not null) — amount invested
   - `current_value` (numeric 15,2, not null) — current fair market value
   - `cost_basis` (numeric 15,2, not null) — total cost basis
   - `shares` (numeric 15,4) — number of shares held
   - `ownership_pct` (numeric 5,2) — ownership percentage
   - `investment_date` (date, not null)
   - `status` (varchar 50, default `'active'`) — active | exited | written-off
   - `notes` (text)
   - `created_at` / `updated_at` timestamps

4. **`valuations`** — Historical valuation snapshots per position (for markup/markdown tracking)
   - `id` (uuid, PK, default gen)
   - `position_id` (uuid, FK → positions.id, not null)
   - `valuation_date` (date, not null)
   - `value` (numeric 15,2, not null) — fair market value at this date
   - `source` (varchar 100) — e.g. "409A", "follow-on round", "internal estimate"
   - `notes` (text)
   - `created_at` timestamp

5. **`fund_metrics`** — Periodic fund-level performance snapshots
   - `id` (uuid, PK, default gen)
   - `fund_id` (uuid, FK → funds.id, not null)
   - `date` (date, not null)
   - `nav` (numeric 15,2) — net asset value
   - `irr` (numeric 8,4) — internal rate of return (as decimal, e.g. 0.2534)
   - `tvpi` (numeric 8,4) — total value to paid-in (MOIC)
   - `dpi` (numeric 8,4) — distributions to paid-in
   - `rvpi` (numeric 8,4) — residual value to paid-in
   - `created_at` timestamp

#### `frontend/scripts/seed-db.ts`
- Seed script that:
  1. Creates 1 admin user (email: `admin@accelerator.com`, password: `admin123`)
  2. Creates 2 funds (e.g. "Accelerator Fund I" vintage 2022, "Accelerator Fund II" vintage 2024)
  3. Creates 3-4 positions per fund with realistic startup names, sectors, investment amounts
  4. Creates 3-4 valuation history entries per position (showing markup/markdown over quarters)
  5. Creates fund_metrics snapshots for each fund (quarterly)
- Run via `npm run db:seed` (already in package.json scripts)

#### `frontend/package.json` changes
- Add `tsx` to devDependencies (for running seed script)
- Add `bcryptjs` + `@types/bcryptjs` for password hashing
- Add `jose` for JWT handling
- Ensure `@neondatabase/serverless` is present (already is)

### Acceptance Criteria
- `npm run db:push` successfully creates all tables in Neon
- `npm run db:seed` populates the database with minimal demo data
- Drizzle Studio (`npm run db:studio`) can browse all tables

---

## TODO 2: Authentication & API Routes

### Goal
Build JWT cookie-based authentication and all CRUD API routes using Next.js Route Handlers (`app/api/`).

### Files to Create/Modify

#### `frontend/lib/auth.ts`
- `hashPassword(password)` — bcryptjs hash
- `verifyPassword(password, hash)` — bcryptjs compare
- `createToken(payload)` — jose JWT sign with `process.env.JWT_SECRET`, 7-day expiry
- `verifyToken(token)` — jose JWT verify
- `getSession(cookies)` — extract + verify token from `auth_token` cookie, return user payload or null

#### `frontend/middleware.ts`
- Next.js middleware that:
  - Allows `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico` without auth
  - Checks for `auth_token` cookie on all other routes
  - Redirects to `/login` if no valid session
  - Adds `x-user-id` and `x-user-role` headers to authenticated requests

#### `frontend/app/api/auth/login/route.ts`
- POST: Accept `{ email, password }`, validate against `users` table, return JWT in httpOnly cookie, respond with user info

#### `frontend/app/api/auth/logout/route.ts`
- POST: Clear the `auth_token` cookie

#### `frontend/app/api/auth/me/route.ts`
- GET: Return current user info from session

#### `frontend/app/api/funds/route.ts`
- GET: List all funds with computed metrics (total positions, total value, total invested, overall MOIC)
- POST: Create a new fund

#### `frontend/app/api/funds/[id]/route.ts`
- GET: Single fund detail with all positions and latest metrics
- PATCH: Update fund fields
- DELETE: Delete fund (soft or hard)

#### `frontend/app/api/positions/route.ts`
- GET: List all positions (optional `?fund_id=` filter)
- POST: Create a new position (also creates initial valuation entry)

#### `frontend/app/api/positions/[id]/route.ts`
- GET: Single position with full valuation history
- PATCH: Update position fields (including current_value → also insert new valuation record)
- DELETE: Delete position

#### `frontend/app/api/positions/[id]/valuations/route.ts`
- GET: All valuations for a position (sorted by date)
- POST: Add a new valuation entry (and update position.current_value)

#### `frontend/app/api/funds/[id]/metrics/route.ts`
- GET: All metric snapshots for a fund
- POST: Add a new metric snapshot

### Shared Helpers

#### `frontend/lib/api-helpers.ts`
- `requireAuth(request)` — extract session from cookies, throw 401 if missing
- `jsonResponse(data, status)` — standardized JSON response wrapper
- `handleApiError(error)` — error handler returning proper status codes

### Acceptance Criteria
- Login at `/api/auth/login` sets httpOnly cookie and returns user
- All `/api/funds/*` and `/api/positions/*` routes return 401 without valid cookie
- CRUD operations work correctly for funds, positions, and valuations
- Creating/updating a valuation automatically updates the position's `current_value`

---

## TODO 3: Dashboard UI & Data Visualization

### Goal
Build the admin dashboard with fund overview, fund detail, position detail, and performance charts. Light theme, clean design.

### Layout & Navigation

#### `frontend/app/(auth)/login/page.tsx`
- Clean login form (email + password) with Shadcn Card, Input, Button
- Form validation with Zod + react-hook-form
- On success, redirect to `/dashboard`

#### `frontend/app/(dashboard)/layout.tsx`
- Sidebar layout using Shadcn `Sidebar` component
- Navigation items:
  - **Dashboard** (overview) — `/dashboard`
  - **Funds** — `/dashboard/funds`
  - **Positions** — `/dashboard/positions`
- Top bar with user name, logout button
- Light background (`bg-gray-50` or `bg-white`)

#### `frontend/app/(dashboard)/dashboard/page.tsx` — Overview
- **Summary cards** (top row):
  - Total AUM (assets under management)
  - Total Funds
  - Average MOIC across funds
  - Total Positions
- **Fund Performance Table**: All funds with columns: Name, Vintage, Committed, Called, NAV, IRR, MOIC, DPI, Status
- **Portfolio Allocation Pie Chart** (Recharts): Sector breakdown across all positions
- **Recent Valuations**: Last 5 valuation updates across all positions

#### `frontend/app/(dashboard)/funds/page.tsx` — Fund List
- Grid of Fund cards (Shadcn Card), each showing:
  - Fund name, vintage year, status badge
  - Key metrics: IRR, MOIC, DPI
  - Total invested vs current value
  - Number of active positions
  - Click → navigates to fund detail

#### `frontend/app/(dashboard)/funds/[id]/page.tsx` — Fund Detail
- **Fund header**: Name, description, vintage, status, committed/called/distributed
- **Performance chart** (Recharts Line/Area chart): NAV over time from `fund_metrics`
- **Key Metrics cards**: IRR, TVPI/MOIC, DPI, RVPI
- **Positions table** (Shadcn Table):
  - Columns: Company, Sector, Stage, Invested, Current Value, MOIC, Markup/Markdown %, Status
  - Markup/Markdown column: Green badge with ↑ for markups, Red badge with ↓ for markdowns
  - MOIC column: Color-coded (green > 1x, red < 1x)
  - Click row → position detail
- **Sector allocation** donut chart for this fund

#### `frontend/app/(dashboard)/positions/page.tsx` — All Positions
- Filterable/sortable table of all positions across all funds
- Columns: Company, Fund, Sector, Stage, Invested, Current Value, MOIC, Change %, Status
- Search bar to filter by company name
- Filter dropdowns: by fund, by sector, by status

#### `frontend/app/(dashboard)/positions/[id]/page.tsx` — Position Detail
- **Company header**: Name, sector, stage, fund name, investment date
- **Value cards**: Cost Basis, Current Value, MOIC, Ownership %, Shares
- **Valuation History Chart** (Recharts Area chart): Value over time with markup/markdown visual
  - Green fill when above cost basis, red fill when below
- **Valuation History Table**: Date, Value, Change from Previous, Change %, Source, Notes
  - Each row shows ↑ green or ↓ red badge for markup/markdown
- **Edit position button** → opens dialog/sheet to update current valuation

### Shared Components

#### `frontend/components/fund-card.tsx`
- Reusable fund summary card with metrics

#### `frontend/components/metric-card.tsx`
- Reusable KPI card (icon, label, value, optional trend indicator)

#### `frontend/components/markup-badge.tsx`
- Badge component: green with ↑ for positive change, red with ↓ for negative, gray for 0

#### `frontend/components/position-table.tsx`
- Reusable positions table with sorting, markup/markdown display

#### `frontend/components/valuation-chart.tsx`
- Recharts area chart for valuation history with color zones

#### `frontend/components/nav-sidebar.tsx`
- Dashboard sidebar navigation component

### Acceptance Criteria
- Login redirects to dashboard
- Dashboard shows summary metrics and fund overview
- Fund detail page shows performance chart and positions with markup/markdown badges
- Position detail shows valuation history chart with green/red zones
- All pages are responsive and use light theme
- Navigation between pages works seamlessly

---

## TODO 4: CRUD Dialogs, Polish & Final Integration

### Goal
Add ability to create/edit funds, positions, and valuations from the UI. Polish loading states, error handling, and overall UX.

### CRUD Dialogs

#### `frontend/components/add-fund-dialog.tsx`
- Shadcn Dialog with form: name, description, vintage year, target size, committed, status
- POST to `/api/funds`, refresh fund list on success
- Toast notification (Sonner) on success/error

#### `frontend/components/add-position-dialog.tsx`
- Shadcn Dialog with form: company name, sector, stage, initial investment, current value, investment date, ownership %, shares, notes
- Fund selector (dropdown of existing funds)
- POST to `/api/positions`, refresh on success

#### `frontend/components/add-valuation-dialog.tsx`
- Shadcn Sheet (slide-in panel) with form: value, date, source, notes
- POST to `/api/positions/[id]/valuations`
- Automatically updates position's current value

#### `frontend/components/edit-fund-dialog.tsx`
- Pre-filled form for editing fund details
- PATCH to `/api/funds/[id]`

#### `frontend/components/edit-position-dialog.tsx`
- Pre-filled form for editing position details
- PATCH to `/api/positions/[id]`

### Data Fetching Hooks

#### `frontend/lib/hooks/use-funds.ts`
- Custom hook: `useFunds()` — fetch all funds with SWR-like pattern (or simple `useEffect` + state)
- `useFund(id)` — fetch single fund with positions

#### `frontend/lib/hooks/use-positions.ts`
- `usePositions(fundId?)` — fetch positions, optionally filtered
- `usePosition(id)` — fetch single position with valuations

### Polish

- **Loading states**: Skeleton components (Shadcn Skeleton) on all data-loading pages
- **Empty states**: Shadcn Empty component when no funds/positions exist, with CTA to add
- **Error handling**: Toast notifications for API errors
- **Toaster setup**: Add `<Toaster />` (Sonner) to root layout
- **Number formatting**: Utility functions for currency ($1.2M), percentage (25.3%), and multiplier (2.5x) display
- **Responsive**: Sidebar collapses on mobile, tables scroll horizontally
- **Confirmation dialogs**: Alert dialog before deleting funds/positions
- **Breadcrumbs**: On fund detail and position detail pages

### Acceptance Criteria
- Admin can create, edit, and delete funds from the UI
- Admin can add positions to funds and record new valuations
- Adding a valuation updates the position's current value and shows in the chart
- Loading skeletons appear while data is fetching
- Empty states guide users to create their first fund
- All actions show toast notifications
- Delete actions require confirmation
- App works on mobile viewports

---

## File Tree (Final)

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── funds/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── positions/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── funds/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── metrics/route.ts
│   │   └── positions/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── valuations/route.ts
│   ├── layout.tsx
│   ├── page.tsx              (redirect to /dashboard or /login)
│   └── globals.css
├── components/
│   ├── ui/                   (existing Shadcn components)
│   ├── nav-sidebar.tsx
│   ├── fund-card.tsx
│   ├── metric-card.tsx
│   ├── markup-badge.tsx
│   ├── position-table.tsx
│   ├── valuation-chart.tsx
│   ├── add-fund-dialog.tsx
│   ├── add-position-dialog.tsx
│   ├── add-valuation-dialog.tsx
│   ├── edit-fund-dialog.tsx
│   └── edit-position-dialog.tsx
├── db/
│   ├── index.ts              (Drizzle client)
│   └── schema.ts             (all table definitions)
├── lib/
│   ├── auth.ts               (JWT + password helpers)
│   ├── api-helpers.ts        (route handler utilities)
│   ├── utils.ts              (existing + formatting utils)
│   └── hooks/
│       ├── use-funds.ts
│       └── use-positions.ts
├── scripts/
│   └── seed-db.ts
├── middleware.ts
├── drizzle.config.ts
└── package.json
```

---

## Environment Variables Needed
- `DATABASE_URL` — Already set (Neon PostgreSQL)
- `JWT_SECRET` — New, for signing auth tokens (generate a random string)

---

## Execution Order
1. **TODO 1** — Schema + DB setup + seed → foundation
2. **TODO 2** — Auth + API routes → data layer
3. **TODO 3** — Dashboard UI → visual layer
4. **TODO 4** — CRUD dialogs + polish → complete experience
