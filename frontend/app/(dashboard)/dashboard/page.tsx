import { db } from "@/db";
import { funds, positions, fundMetrics } from "@/db/schema";
import { desc } from "drizzle-orm";
import { DollarSign, Briefcase, TrendingUp, ArrowUpDown } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FundCard } from "@/components/dashboard/fund-card";
import {
  formatCompactCurrency,
  formatMultiple,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allFunds = await db.select().from(funds).orderBy(desc(funds.vintageYear));
  const allPositions = await db.select().from(positions);
  const allMetrics = await db.select().from(fundMetrics).orderBy(desc(fundMetrics.date));

  // Latest metric per fund
  const latestMetricByFund: Record<string, (typeof allMetrics)[0]> = {};
  for (const m of allMetrics) {
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
  const overallMOIC = totalInvested > 0 ? totalAUM / totalInvested : 0;

  // Per-fund summaries
  const fundSummaries = allFunds.map((fund) => {
    const fp = allPositions.filter((p) => p.fundId === fund.id);
    const currentValue = fp.reduce(
      (sum, p) => sum + parseFloat(p.currentValue || "0"),
      0
    );
    const costBasis = fp.reduce(
      (sum, p) => sum + parseFloat(p.costBasis || "0"),
      0
    );
    const markups = fp.filter(
      (p) => parseFloat(p.currentValue || "0") > parseFloat(p.costBasis || "0")
    ).length;
    const markdowns = fp.filter(
      (p) => parseFloat(p.currentValue || "0") < parseFloat(p.costBasis || "0")
    ).length;
    const metric = latestMetricByFund[fund.id];

    return {
      ...fund,
      positionCount: fp.length,
      totalCurrentValue: currentValue,
      totalCostBasis: costBasis,
      moic: costBasis > 0 ? currentValue / costBasis : 0,
      markups,
      markdowns,
      latestIRR: metric?.irr ? parseFloat(metric.irr) : null,
      latestTVPI: metric?.tvpi ? parseFloat(metric.tvpi) : null,
      latestDPI: metric?.dpi ? parseFloat(metric.dpi) : null,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregated performance across all funds
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total AUM"
          value={formatCompactCurrency(totalAUM)}
          subtitle={`Across ${allFunds.length} funds`}
          icon={DollarSign}
          trend="neutral"
        />
        <KPICard
          title="Total Invested"
          value={formatCompactCurrency(totalInvested)}
          subtitle={`${allPositions.length} positions`}
          icon={Briefcase}
          trend="neutral"
        />
        <KPICard
          title="Overall MOIC"
          value={formatMultiple(overallMOIC)}
          subtitle={overallMOIC >= 1 ? "Above cost basis" : "Below cost basis"}
          icon={TrendingUp}
          trend={overallMOIC >= 1 ? "up" : "down"}
        />
        <KPICard
          title="Distributions"
          value={formatCompactCurrency(totalDistributed)}
          subtitle="Returned to LPs"
          icon={ArrowUpDown}
          trend="neutral"
        />
      </div>

      {/* Fund Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Funds</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {fundSummaries.map((fund) => (
            <FundCard key={fund.id} fund={fund} />
          ))}
        </div>
      </div>
    </div>
  );
}
