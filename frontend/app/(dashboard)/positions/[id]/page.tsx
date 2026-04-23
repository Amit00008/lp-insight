import { db } from "@/db";
import { positions, valuations, funds } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ValuationChart } from "@/components/dashboard/valuation-chart";
import { ValuationHistory } from "@/components/dashboard/valuation-history";
import {
  formatCurrency,
  formatCompactCurrency,
  formatMultiple,
  formatDate,
  calcMarkupPct,
  formatPercent,
} from "@/lib/format";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [position] = await db
    .select()
    .from(positions)
    .where(eq(positions.id, id))
    .limit(1);

  if (!position) notFound();

  // Get parent fund
  const [fund] = await db
    .select()
    .from(funds)
    .where(eq(funds.id, position.fundId))
    .limit(1);

  // Get valuation history
  const positionValuations = await db
    .select()
    .from(valuations)
    .where(eq(valuations.positionId, id))
    .orderBy(asc(valuations.valuationDate));

  const cv = parseFloat(position.currentValue || "0");
  const cb = parseFloat(position.costBasis || "0");
  const moic = cb > 0 ? cv / cb : 0;
  const markupPct = calcMarkupPct(cv, cb);
  const isMarkup = markupPct > 0;
  const isMarkdown = markupPct < 0;

  // Chart data
  const chartData = [
    {
      date: position.investmentDate,
      value: parseFloat(position.initialInvestment || "0"),
      costBasis: cb,
      label: "Initial",
    },
    ...positionValuations.map((v) => ({
      date: v.valuationDate,
      value: parseFloat(v.value || "0"),
      costBasis: cb,
      label: v.source || "",
    })),
  ];

  const statusColor =
    position.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : position.status === "exited"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-red-50 text-red-600 border-red-200";

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <Link href={`/funds/${position.fundId}`}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {fund?.name || "Fund"}
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {position.companyName}
              </h1>
              <Badge variant="outline" className={statusColor}>
                {position.status}
              </Badge>
              {position.sector && (
                <Badge variant="secondary" className="font-normal">
                  {position.sector}
                </Badge>
              )}
              {position.stage && (
                <Badge variant="secondary" className="font-normal">
                  {position.stage}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {fund?.name} · Invested {formatDate(position.investmentDate)}
            </p>
          </div>
          <div className="text-right">
            {isMarkup && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                +{markupPct.toFixed(1)}% markup
              </div>
            )}
            {isMarkdown && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600">
                <TrendingDown className="h-4 w-4" />
                {markupPct.toFixed(1)}% markdown
              </div>
            )}
            {!isMarkup && !isMarkdown && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-500">
                At cost
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Current Value"
          value={formatCompactCurrency(cv)}
          subtitle={`Invested: ${formatCompactCurrency(position.initialInvestment)}`}
          icon={DollarSign}
          trend={cv >= cb ? "up" : "down"}
        />
        <KPICard
          title="MOIC"
          value={formatMultiple(moic)}
          subtitle={`Cost basis: ${formatCompactCurrency(cb)}`}
          icon={TrendingUp}
          trend={moic >= 1 ? "up" : "down"}
        />
        <KPICard
          title="Ownership"
          value={position.ownershipPct ? `${position.ownershipPct}%` : "—"}
          subtitle={position.shares ? `${parseFloat(position.shares).toLocaleString()} shares` : "—"}
          icon={Percent}
          trend="neutral"
        />
        <KPICard
          title="Investment Date"
          value={formatDate(position.investmentDate)}
          subtitle={`${positionValuations.length} valuations recorded`}
          icon={Calendar}
          trend="neutral"
        />
      </div>

      {/* Position Details Card */}
      {position.notes && (
        <Card className="gap-0 py-0">
          <CardHeader className="pt-5 px-5 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <p className="text-sm text-foreground">{position.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Valuation Chart */}
      {chartData.length > 1 && (
        <Card className="gap-0 py-0">
          <CardHeader className="pt-5 px-5 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Valuation History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <ValuationChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Valuation History Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Valuation Snapshots ({positionValuations.length})
        </h2>
        <ValuationHistory
          valuations={positionValuations}
          costBasis={cb}
        />
      </div>
    </div>
  );
}
