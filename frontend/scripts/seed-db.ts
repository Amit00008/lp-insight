import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import bcrypt from "bcryptjs";

const {
  users,
  funds,
  positions,
  valuations,
  fundMetrics,
} = schema;

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding database...\n");

  // ── 1. Admin user ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@accelerator.com",
      passwordHash,
      name: "Fund Admin",
      role: "admin",
    })
    .returning();
  console.log(`✅ Created admin user: ${admin.email}`);

  // ── 2. Funds ───────────────────────────────────────────────────────
  const [fund1] = await db
    .insert(funds)
    .values({
      name: "Accelerator Fund I",
      description:
        "Our inaugural early-stage fund focused on pre-seed and seed investments in B2B SaaS, fintech, and healthtech startups across South-East Asia.",
      vintageYear: 2022,
      targetSize: "5000000.00",
      totalCommitted: "4200000.00",
      totalCalled: "3150000.00",
      totalDistributed: "250000.00",
      status: "active",
    })
    .returning();

  const [fund2] = await db
    .insert(funds)
    .values({
      name: "Accelerator Fund II",
      description:
        "Second-generation fund targeting seed-stage climate-tech, AI/ML infrastructure, and developer tools companies.",
      vintageYear: 2024,
      targetSize: "10000000.00",
      totalCommitted: "7500000.00",
      totalCalled: "2250000.00",
      totalDistributed: "0.00",
      status: "active",
    })
    .returning();

  console.log(`✅ Created funds: "${fund1.name}", "${fund2.name}"`);

  // ── 3. Positions (Fund I — 4 companies) ────────────────────────────
  const fund1Positions = await db
    .insert(positions)
    .values([
      {
        fundId: fund1.id,
        companyName: "PayFlow",
        sector: "Fintech",
        stage: "Seed",
        initialInvestment: "500000.00",
        currentValue: "1750000.00",
        costBasis: "500000.00",
        shares: "250000.0000",
        ownershipPct: "8.50",
        investmentDate: "2022-06-15",
        status: "active",
        notes: "B2B payments platform for SMEs. Strong revenue growth.",
      },
      {
        fundId: fund1.id,
        companyName: "MediSync",
        sector: "Healthtech",
        stage: "Pre-Seed",
        initialInvestment: "300000.00",
        currentValue: "180000.00",
        costBasis: "300000.00",
        shares: "150000.0000",
        ownershipPct: "12.00",
        investmentDate: "2022-09-01",
        status: "active",
        notes: "EHR interoperability middleware. Pivoting to new market segment.",
      },
      {
        fundId: fund1.id,
        companyName: "CloudKitchen OS",
        sector: "SaaS",
        stage: "Seed",
        initialInvestment: "400000.00",
        currentValue: "1200000.00",
        costBasis: "400000.00",
        shares: "200000.0000",
        ownershipPct: "6.25",
        investmentDate: "2023-01-20",
        status: "active",
        notes: "Operating system for cloud kitchens. Series A in progress.",
      },
      {
        fundId: fund1.id,
        companyName: "StackDeploy",
        sector: "DevTools",
        stage: "Seed",
        initialInvestment: "350000.00",
        currentValue: "700000.00",
        costBasis: "350000.00",
        shares: "175000.0000",
        ownershipPct: "5.00",
        investmentDate: "2023-04-10",
        status: "active",
        notes: "One-click infra deployment tool. Growing developer community.",
      },
    ])
    .returning();

  console.log(
    `✅ Created ${fund1Positions.length} positions for "${fund1.name}"`
  );

  // ── 4. Positions (Fund II — 3 companies) ───────────────────────────
  const fund2Positions = await db
    .insert(positions)
    .values([
      {
        fundId: fund2.id,
        companyName: "CarbonLedger",
        sector: "Climate Tech",
        stage: "Seed",
        initialInvestment: "600000.00",
        currentValue: "900000.00",
        costBasis: "600000.00",
        shares: "300000.0000",
        ownershipPct: "10.00",
        investmentDate: "2024-03-01",
        status: "active",
        notes: "Carbon credit verification and trading platform.",
      },
      {
        fundId: fund2.id,
        companyName: "NeuralForge",
        sector: "AI/ML",
        stage: "Pre-Seed",
        initialInvestment: "450000.00",
        currentValue: "1350000.00",
        costBasis: "450000.00",
        shares: "225000.0000",
        ownershipPct: "15.00",
        investmentDate: "2024-05-15",
        status: "active",
        notes: "ML model training infrastructure. 3x markup after demo day.",
      },
      {
        fundId: fund2.id,
        companyName: "SynthQL",
        sector: "DevTools",
        stage: "Seed",
        initialInvestment: "500000.00",
        currentValue: "500000.00",
        costBasis: "500000.00",
        shares: "250000.0000",
        ownershipPct: "7.50",
        investmentDate: "2024-08-20",
        status: "active",
        notes: "AI-powered database query generator. Just invested, at cost.",
      },
    ])
    .returning();

  console.log(
    `✅ Created ${fund2Positions.length} positions for "${fund2.name}"`
  );

  // ── 5. Valuations — historical snapshots for each position ─────────
  const allPositions = [...fund1Positions, ...fund2Positions];

  // Fund I positions get quarterly valuations from investment through 2024-Q4
  const fund1ValuationData: {
    positionId: string;
    entries: { date: string; value: string; source: string }[];
  }[] = [
    {
      positionId: fund1Positions[0].id, // PayFlow
      entries: [
        { date: "2022-09-30", value: "500000.00", source: "Internal estimate" },
        { date: "2022-12-31", value: "600000.00", source: "Internal estimate" },
        { date: "2023-03-31", value: "750000.00", source: "Follow-on round" },
        { date: "2023-06-30", value: "900000.00", source: "Internal estimate" },
        { date: "2023-09-30", value: "1100000.00", source: "Internal estimate" },
        { date: "2023-12-31", value: "1300000.00", source: "409A valuation" },
        { date: "2024-03-31", value: "1500000.00", source: "Follow-on round" },
        { date: "2024-06-30", value: "1600000.00", source: "Internal estimate" },
        { date: "2024-09-30", value: "1750000.00", source: "Internal estimate" },
      ],
    },
    {
      positionId: fund1Positions[1].id, // MediSync (markdown story)
      entries: [
        { date: "2022-12-31", value: "300000.00", source: "Internal estimate" },
        { date: "2023-03-31", value: "350000.00", source: "Internal estimate" },
        { date: "2023-06-30", value: "280000.00", source: "Internal estimate" },
        { date: "2023-09-30", value: "220000.00", source: "Internal estimate" },
        { date: "2023-12-31", value: "200000.00", source: "409A valuation" },
        { date: "2024-03-31", value: "180000.00", source: "Internal estimate" },
      ],
    },
    {
      positionId: fund1Positions[2].id, // CloudKitchen OS
      entries: [
        { date: "2023-03-31", value: "400000.00", source: "Internal estimate" },
        { date: "2023-06-30", value: "520000.00", source: "Internal estimate" },
        { date: "2023-09-30", value: "700000.00", source: "Follow-on round" },
        { date: "2023-12-31", value: "850000.00", source: "Internal estimate" },
        { date: "2024-03-31", value: "1000000.00", source: "409A valuation" },
        { date: "2024-06-30", value: "1100000.00", source: "Internal estimate" },
        { date: "2024-09-30", value: "1200000.00", source: "Internal estimate" },
      ],
    },
    {
      positionId: fund1Positions[3].id, // StackDeploy
      entries: [
        { date: "2023-06-30", value: "350000.00", source: "Internal estimate" },
        { date: "2023-09-30", value: "400000.00", source: "Internal estimate" },
        { date: "2023-12-31", value: "500000.00", source: "Internal estimate" },
        { date: "2024-03-31", value: "600000.00", source: "Follow-on round" },
        { date: "2024-06-30", value: "650000.00", source: "Internal estimate" },
        { date: "2024-09-30", value: "700000.00", source: "Internal estimate" },
      ],
    },
  ];

  // Fund II positions get fewer valuations (newer fund)
  const fund2ValuationData: {
    positionId: string;
    entries: { date: string; value: string; source: string }[];
  }[] = [
    {
      positionId: fund2Positions[0].id, // CarbonLedger
      entries: [
        { date: "2024-06-30", value: "650000.00", source: "Internal estimate" },
        { date: "2024-09-30", value: "900000.00", source: "Follow-on round" },
      ],
    },
    {
      positionId: fund2Positions[1].id, // NeuralForge
      entries: [
        { date: "2024-06-30", value: "450000.00", source: "Internal estimate" },
        { date: "2024-09-30", value: "1350000.00", source: "Follow-on round" },
      ],
    },
    {
      positionId: fund2Positions[2].id, // SynthQL
      entries: [
        { date: "2024-09-30", value: "500000.00", source: "Internal estimate" },
      ],
    },
  ];

  const allValuationRows = [
    ...fund1ValuationData,
    ...fund2ValuationData,
  ].flatMap((p) =>
    p.entries.map((e) => ({
      positionId: p.positionId,
      valuationDate: e.date,
      value: e.value,
      source: e.source,
    }))
  );

  await db.insert(valuations).values(allValuationRows);
  console.log(`✅ Created ${allValuationRows.length} valuation snapshots`);

  // ── 6. Fund Metrics — quarterly snapshots ──────────────────────────
  const fund1MetricsData = [
    { date: "2022-12-31", nav: "1500000.00", irr: "-0.0200", tvpi: "0.9500", dpi: "0.0000", rvpi: "0.9500" },
    { date: "2023-06-30", nav: "2070000.00", irr: "0.0800", tvpi: "1.1500", dpi: "0.0000", rvpi: "1.1500" },
    { date: "2023-12-31", nav: "2850000.00", irr: "0.1800", tvpi: "1.3500", dpi: "0.0000", rvpi: "1.3500" },
    { date: "2024-06-30", nav: "3530000.00", irr: "0.2200", tvpi: "1.5200", dpi: "0.0800", rvpi: "1.4400" },
    { date: "2024-09-30", nav: "3830000.00", irr: "0.2534", tvpi: "1.6100", dpi: "0.0800", rvpi: "1.5300" },
  ];

  const fund2MetricsData = [
    { date: "2024-06-30", nav: "1550000.00", irr: "-0.0500", tvpi: "0.9200", dpi: "0.0000", rvpi: "0.9200" },
    { date: "2024-09-30", nav: "2750000.00", irr: "0.3200", tvpi: "1.7700", dpi: "0.0000", rvpi: "1.7700" },
  ];

  await db.insert(fundMetrics).values(
    fund1MetricsData.map((m) => ({ fundId: fund1.id, ...m }))
  );
  await db.insert(fundMetrics).values(
    fund2MetricsData.map((m) => ({ fundId: fund2.id, ...m }))
  );
  console.log(
    `✅ Created ${fund1MetricsData.length + fund2MetricsData.length} fund metric snapshots`
  );

  console.log("\n🎉 Seeding complete!");
  console.log("   Admin login: admin@accelerator.com / admin123");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
