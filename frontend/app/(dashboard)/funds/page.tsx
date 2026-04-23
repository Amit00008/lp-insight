import { db } from "@/db";
import { funds, positions, fundMetrics } from "@/db/schema";
import { desc } from "drizzle-orm";
import { FundCard } from "@/components/dashboard/fund-card";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const allFunds = await db.select().from(funds).orderBy(desc(funds.vintageYear));
  const allPositions = await db.select().from(positions);
  const allMetrics = await db.select().from(fundMetrics).orderBy(desc(fundMetrics.date));

  const latestMetricByFund: Record<string, (typeof allMetrics)[0]> = {};
  for (const m of allMetrics) {
    if (!latestMetricByFund[m.fundId]) {
      latestMetricByFund[m.fundId] = m;
    }
  }

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Funds</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and review fund performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fundSummaries.map((fund) => (
          <FundCard key={fund.id} fund={fund} />
        ))}
      </div>
    </div>
  );
}
