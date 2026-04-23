import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatDate, calcMarkupPct, formatMultiple } from "@/lib/format";
import type { Valuation } from "@/db/schema";

export function ValuationHistory({
  valuations,
  costBasis,
}: {
  valuations: Valuation[];
  costBasis: number;
}) {
  if (valuations.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
        No valuation snapshots recorded yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold text-right">Value</TableHead>
            <TableHead className="font-semibold text-right">MOIC</TableHead>
            <TableHead className="font-semibold text-center">vs Cost Basis</TableHead>
            <TableHead className="font-semibold">Source</TableHead>
            <TableHead className="font-semibold">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...valuations].reverse().map((v, i) => {
            const val = parseFloat(v.value || "0");
            const moic = costBasis > 0 ? val / costBasis : 0;
            const pct = calcMarkupPct(val, costBasis);
            const isUp = pct > 0;
            const isDown = pct < 0;

            // Calculate change from previous valuation
            const prevIdx = valuations.length - 1 - i - 1;
            let periodChange: number | null = null;
            if (prevIdx >= 0) {
              const prevVal = parseFloat(valuations[prevIdx].value || "0");
              if (prevVal > 0) {
                periodChange = ((val - prevVal) / prevVal) * 100;
              }
            }

            return (
              <TableRow key={v.id}>
                <TableCell className="font-medium text-sm">
                  {formatDate(v.valuationDate)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(val)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatMultiple(moic)}
                </TableCell>
                <TableCell className="text-center">
                  {isUp && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      +{pct.toFixed(1)}%
                    </div>
                  )}
                  {isDown && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      {pct.toFixed(1)}%
                    </div>
                  )}
                  {!isUp && !isDown && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                      <Minus className="h-3 w-3" />
                      At cost
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {v.source || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {v.notes || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
