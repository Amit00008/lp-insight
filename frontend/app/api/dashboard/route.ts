import { NextResponse } from "next/server";
import { db } from "@/db";
import { funds, positions, fundMetrics } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/dashboard — Aggregated dashboard data
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all funds
  const allFunds = await db
    .select()
    .from(funds)
    .orderBy(desc(funds.vintageYear));

  // Get all positions
  const allPositions = await db.select().from(positions);

  // Get latest metrics for each fund
  const latestMetrics = await db
    .select()
    .from(fundMetrics)
    .orderBy(desc(fundMetrics.date));

  // Build per-fund latest metric map
  const latestMetricByFund: Record<string, typeof latestMetrics[0]> = {};
  for (const m of latestMetrics) {
    if (!latestMetricByFund[m.fundId]) {
      latestMetricByFund[m.fundId] = m;
    }
  }

  // Aggregate stats
  const totalAUM = allPositions.reduce(
    (sum, p) => sum + parseFloat(p.currentValue || "0"),
    0
  );
  const totalInvested = allPositions.reduce(
    (sum, p) => sum + parseFloat(p.costBasis || "0"),
    0
  );
  const totalDistributed = allFunds.reduce(
    (sum, f) => sum + parseFloat(f.totalDistributed || "0"),
    0
  );

  // Per-fund summaries
  const fundSummaries = allFunds.map((fund) => {
    const fundPositions = allPositions.filter((p) => p.fundId === fund.id);
    const fundCurrentValue = fundPositions.reduce(
      (sum, p) => sum + parseFloat(p.currentValue || "0"),
      0
    );
    const fundCostBasis = fundPositions.reduce(
      (sum, p) => sum + parseFloat(p.costBasis || "0"),
      0
    );
    const metric = latestMetricByFund[fund.id];

    const markups = fundPositions.filter(
      (p) => parseFloat(p.currentValue || "0") > parseFloat(p.costBasis || "0")
    ).length;
    const markdowns = fundPositions.filter(
      (p) => parseFloat(p.currentValue || "0") < parseFloat(p.costBasis || "0")
    ).length;
    const atCost = fundPositions.filter(
      (p) =>
        parseFloat(p.currentValue || "0") === parseFloat(p.costBasis || "0")
    ).length;

    return {
      ...fund,
      positionCount: fundPositions.length,
      totalCurrentValue: fundCurrentValue,
      totalCostBasis: fundCostBasis,
      moic: fundCostBasis > 0 ? fundCurrentValue / fundCostBasis : 0,
      markups,
      markdowns,
      atCost,
      latestMetric: metric || null,
    };
  });

  return NextResponse.json({
    summary: {
      totalFunds: allFunds.length,
      totalPositions: allPositions.length,
      totalAUM,
      totalInvested,
      totalDistributed,
      overallMOIC: totalInvested > 0 ? totalAUM / totalInvested : 0,
    },
    funds: fundSummaries,
  });
}
