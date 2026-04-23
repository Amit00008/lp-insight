import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import {
  formatCurrency,
  formatMultiple,
  formatDate,
  calcMarkupPct,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Position } from "@/db/schema";

export function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
        No positions in this fund yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Sector</TableHead>
            <TableHead className="font-semibold">Stage</TableHead>
            <TableHead className="font-semibold text-right">Cost Basis</TableHead>
            <TableHead className="font-semibold text-right">Current Value</TableHead>
            <TableHead className="font-semibold text-right">MOIC</TableHead>
            <TableHead className="font-semibold text-center">Markup / Markdown</TableHead>
            <TableHead className="font-semibold text-right">Invested</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((pos) => {
            const cv = parseFloat(pos.currentValue || "0");
            const cb = parseFloat(pos.costBasis || "0");
            const moic = cb > 0 ? cv / cb : 0;
            const markupPct = calcMarkupPct(cv, cb);
            const isMarkup = markupPct > 0;
            const isMarkdown = markupPct < 0;
            const isAtCost = markupPct === 0;

            return (
              <TableRow key={pos.id} className="group">
                <TableCell>
                  <Link
                    href={`/positions/${pos.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {pos.companyName}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {pos.sector || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal text-xs">
                    {pos.stage || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(cb)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(cv)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatMultiple(moic)}
                </TableCell>
                <TableCell className="text-center">
                  {isMarkup && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      +{markupPct.toFixed(1)}%
                    </div>
                  )}
                  {isMarkdown && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      {markupPct.toFixed(1)}%
                    </div>
                  )}
                  {isAtCost && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                      <Minus className="h-3 w-3" />
                      At cost
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDate(pos.investmentDate)}
                </TableCell>
                <TableCell>
                  <Link href={`/positions/${pos.id}`}>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
