import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Funds ───────────────────────────────────────────────────────────
export const funds = pgTable("funds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  vintageYear: integer("vintage_year").notNull(),
  targetSize: numeric("target_size", { precision: 15, scale: 2 }),
  totalCommitted: numeric("total_committed", { precision: 15, scale: 2 }),
  totalCalled: numeric("total_called", { precision: 15, scale: 2 }),
  totalDistributed: numeric("total_distributed", { precision: 15, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Positions (portfolio companies) ─────────────────────────────────
export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id")
    .references(() => funds.id, { onDelete: "cascade" })
    .notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  stage: varchar("stage", { length: 50 }),
  initialInvestment: numeric("initial_investment", { precision: 15, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 15, scale: 2 }).notNull(),
  costBasis: numeric("cost_basis", { precision: 15, scale: 2 }).notNull(),
  shares: numeric("shares", { precision: 15, scale: 4 }),
  ownershipPct: numeric("ownership_pct", { precision: 5, scale: 2 }),
  investmentDate: date("investment_date").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Valuations (historical valuation snapshots per position) ────────
export const valuations = pgTable("valuations", {
  id: uuid("id").primaryKey().defaultRandom(),
  positionId: uuid("position_id")
    .references(() => positions.id, { onDelete: "cascade" })
    .notNull(),
  valuationDate: date("valuation_date").notNull(),
  value: numeric("value", { precision: 15, scale: 2 }).notNull(),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Fund Metrics (periodic fund-level performance snapshots) ────────
export const fundMetrics = pgTable("fund_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id")
    .references(() => funds.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  nav: numeric("nav", { precision: 15, scale: 2 }),
  irr: numeric("irr", { precision: 8, scale: 4 }),
  tvpi: numeric("tvpi", { precision: 8, scale: 4 }),
  dpi: numeric("dpi", { precision: 8, scale: 4 }),
  rvpi: numeric("rvpi", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Type exports ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Fund = typeof funds.$inferSelect;
export type NewFund = typeof funds.$inferInsert;

export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;

export type Valuation = typeof valuations.$inferSelect;
export type NewValuation = typeof valuations.$inferInsert;

export type FundMetric = typeof fundMetrics.$inferSelect;
export type NewFundMetric = typeof fundMetrics.$inferInsert;
