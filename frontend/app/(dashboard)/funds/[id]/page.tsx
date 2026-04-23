import { db } from "@/db";
import { funds, positions, fundMetrics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { FundPerformanceChart } from "@/components/dashboard/fund-performance-chart";
import { FundAdminActions } from "@/components/dashboard/fund-admin-actions";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMultiple,
  formatPercent,
} from "@/lib/format";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const [fund] = await db.select().from(funds).where(eq(funds.id, id)).limit(1);
  if (!fund) notFound();

  const fundPositions = await db
    .select()
    .from(positions)
    .where(eq(positions.fundId, id))
    .orderBy(positions.companyName);

  const metrics = await db
    .select()
    .from(fundMetrics)
    .where(eq(fundMetrics.fundId, id))
    .orderBy(asc(fundMetrics.date));

  // Calculate aggregates
  const totalCurrentValue = fundPositions.reduce(
    (sum, p) => sum + parseFloat(p.currentValue || "0"),
    0
  );
  const totalCostBasis = fundPositions.reduce(
    (sum, p) => sum + parseFloat(p.costBasis || "0"),
    0
  );
  const moic = totalCostBasis > 0 ? totalCurrentValue / totalCostBasis : 0;
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const statusColor =
    fund.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : fund.status === "closed"
        ? "bg-gray-50 text-gray-600 border-gray-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  // Serialize metrics for client chart component
  const chartData = metrics.map((m) => ({
    date: m.date,
    nav: m.nav ? parseFloat(m.nav) : 0,
    irr: m.irr ? parseFloat(m.irr) * 100 : 0,
    tvpi: m.tvpi ? parseFloat(m.tvpi) : 0,
    dpi: m.dpi ? parseFloat(m.dpi) : 0,
  }));

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <Link href="/funds">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Funds
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{fund.name}</h1>
              <Badge variant="outline" className={statusColor}>
                {fund.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Vintage {fund.vintageYear}
              {fund.description && ` · ${fund.description}`}
            </p>
          </div>
          {isAdmin && (
            <FundAdminActions
              fund={{
                id: fund.id,
                name: fund.name,
                description: fund.description,
                vintageYear: fund.vintageYear,
                targetSize: fund.targetSize,
                totalCommitted: fund.totalCommitted,
                totalCalled: fund.totalCalled,
                totalDistributed: fund.totalDistributed,
                status: fund.status,
              }}
            />
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="NAV"
          value={formatCompactCurrency(totalCurrentValue)}
          subtitle={`Cost basis: ${formatCompactCurrency(totalCostBasis)}`}
          icon={DollarSign}
          trend={totalCurrentValue >= totalCostBasis ? "up" : "down"}
        />
        <KPICard
          title="MOIC"
          value={formatMultiple(moic)}
          subtitle={moic >= 1 ? "Above cost" : "Below cost"}
          icon={TrendingUp}
          trend={moic >= 1 ? "up" : "down"}
        />
        <KPICard
          title="IRR"
          value={latestMetric?.irr ? formatPercent(parseFloat(latestMetric.irr)) : "—"}
          subtitle="Net to fund"
          icon={BarChart3}
          trend={
            latestMetric?.irr
              ? parseFloat(latestMetric.irr) >= 0
                ? "up"
                : "down"
              : "neutral"
          }
        />
        <KPICard
          title="DPI"
          value={latestMetric?.dpi ? formatMultiple(parseFloat(latestMetric.dpi)) : "—"}
          subtitle={`Committed: ${formatCompactCurrency(fund.totalCommitted)}`}
          icon={PieChart}
          trend="neutral"
        />
      </div>

      {/* Fund Info Card */}
      <Card className="gap-0 py-0">
        <CardHeader className="pt-5 px-5 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Fund Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Target Size</p>
              <p className="text-sm font-semibold mt-0.5">
                {formatCurrency(fund.targetSize)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Committed</p>
              <p className="text-sm font-semibold mt-0.5">
                {formatCurrency(fund.totalCommitted)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Capital Called</p>
              <p className="text-sm font-semibold mt-0.5">
                {formatCurrency(fund.totalCalled)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distributions</p>
              <p className="text-sm font-semibold mt-0.5">
                {formatCurrency(fund.totalDistributed)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card className="gap-0 py-0">
          <CardHeader className="pt-5 px-5 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Performance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <FundPerformanceChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Positions Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Portfolio Positions ({fundPositions.length})
        </h2>
        <PositionsTable positions={fundPositions} />
      </div>
    </div>
  );
}
