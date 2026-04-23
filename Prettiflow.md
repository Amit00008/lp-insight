TYPE READY
CONTEXT
SUMMARY: A comprehensive Limited Partner (LP) portal for VC accelerators to track multiple fund performance, view detailed position markups/markdowns, and monitor investment metrics in real-time.
S
GOAL: Enable LPs to access secure, role-based dashboards showing fund performance, portfolio positions, valuation changes, and key investment metrics with drill-down capabilities.

TECH
FRONTEND: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Recharts for analytics, TanStack Query for data fetching
BACKEND: Next.js API Routes (app/api), Drizzle ORM, Neon PostgreSQL (app_cmobwv5y), JWT authentication, middleware for role-based access
DATABASE_REQUIRED: true

FEATURES
- Multi-fund dashboard with performance metrics (IRR, MOIC, DPI)
- Position-level tracking with markup/markdown visualization
- Real-time valuation updates and historical performance charts
- LP portfolio allocation breakdown by fund and sector
- Detailed position drill-down with company info, entry/exit data
- Role-based access control (LP, Fund Manager, Admin)
- Export reports (PDF/CSV) for fund performance
- Secure authentication with LP email verification
- Fund comparison tools and performance benchmarking
- Investment timeline and milestone tracking

TODOS
[1] TITLE: Database Schema & Drizzle Setup
    DESC: Initialize Drizzle ORM with Neon PostgreSQL (app_cmobwv5y). Create tables: users (LPs/managers), funds, positions, valuations, transactions, performance_metrics. Set up migrations in db/migrations/. Create db/schema.ts with Drizzle table definitions. Configure db/client.ts with Neon connection string. Add seed data script in db/seed.ts.

[2] TITLE: Authentication & API Routes
    DESC: Build Next.js API routes in app/api/: auth/login, auth/register, auth/verify, funds/[id], positions/[id], valuations. Implement JWT middleware in lib/auth.ts. Create lib/db.ts for Drizzle queries. Add role-based access control in middleware.ts. Secure endpoints with authentication checks.

[3] TITLE: Dashboard UI & Data Visualization
    DESC: Build app/(dashboard)/layout.tsx with sidebar navigation. Create app/(dashboard)/funds page with fund cards showing IRR/MOIC/DPI. Build app/(dashboard)/funds/[id] with performance charts (Recharts), position table with markup/markdown columns. Create app/(dashboard)/positions/[id] for drill-down details. Style all components with Tailwind CSS and Shadcn/ui (Card, Table, Chart, Button, Badge).

[4] TITLE: Advanced Features & Polish
    DESC: Implement TanStack Query hooks in lib/hooks/ for data fetching. Add export functionality (jsPDF/papaparse) in app/(dashboard)/reports. Create comparison view for multiple funds. Add real-time updates with polling. Implement error boundaries and loading states. Add responsive design for mobile. Set up environment variables in .env.local.