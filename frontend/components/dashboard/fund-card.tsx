import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  formatCompactCurrency,
  formatMultiple,
  formatPercent,
} from "@/lib/format";

interface FundSummary {
  id: string;
  name: string;
  vintageYear: number;
  status: string;
  totalCommitted: string | null;
  totalCalled: string | null;
  positionCount: number;
  totalCurrentValue: number;
  totalCostBasis: number;
  moic: number;
  markups: number;
  markdowns: number;
  latestIRR: number | null;
  latestTVPI: number | null;
  latestDPI: number | null;
}

export function FundCard({ fund }: { fund: FundSummary }) {
  const statusColor =
    fund.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : fund.status === "closed"
        ? "bg-gray-50 text-gray-600 border-gray-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <Link href={`/funds/${fund.id}`}>
      <Card className="gap-0 py-0 transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{fund.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Vintage {fund.vintageYear} · {fund.positionCount} positions
              </p>
            </div>
            <Badge variant="outline" className={statusColor}>
              {fund.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs text-muted-foreground">MOIC</p>
              <p className="text-lg font-semibold">{formatMultiple(fund.moic)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">IRR</p>
              <p className="text-lg font-semibold">
                {fund.latestIRR != null ? formatPercent(fund.latestIRR) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NAV</p>
              <p className="text-lg font-semibold">
                {formatCompactCurrency(fund.totalCurrentValue)}
              </p>
            </div>
          </div>

          {/* Markup / Markdown badges */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-700 font-medium">{fund.markups} markups</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              <span className="text-red-600 font-medium">{fund.markdowns} markdowns</span>
            </div>
            <div className="ml-auto">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
