"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import { FundFormDialog } from "./fund-form-dialog";
import { DeleteFundDialog } from "./delete-fund-dialog";

interface FundRow {
  id: string;
  name: string;
  description: string | null;
  vintageYear: number;
  targetSize: string | null;
  totalCommitted: string | null;
  totalCalled: string | null;
  totalDistributed: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminFundsTable({ funds }: { funds: FundRow[] }) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editFund, setEditFund] = useState<FundRow | null>(null);
  const [deleteFund, setDeleteFund] = useState<FundRow | null>(null);

  const filtered = funds.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.status.toLowerCase().includes(search.toLowerCase()) ||
      String(f.vintageYear).includes(search)
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "deploying":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "harvesting":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "closed":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search funds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fund
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Fund Name</TableHead>
              <TableHead className="font-semibold">Vintage</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Target Size</TableHead>
              <TableHead className="font-semibold text-right">Committed</TableHead>
              <TableHead className="font-semibold text-right">Called</TableHead>
              <TableHead className="font-semibold text-right">Distributed</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {search ? "No funds match your search." : "No funds yet. Click \"Add Fund\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((fund) => (
                <TableRow key={fund.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{fund.name}</p>
                      {fund.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {fund.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{fund.vintageYear}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(fund.status)}>
                      {fund.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fund.targetSize ? formatCompactCurrency(fund.targetSize) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fund.totalCommitted ? formatCompactCurrency(fund.totalCommitted) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fund.totalCalled ? formatCompactCurrency(fund.totalCalled) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fund.totalDistributed ? formatCompactCurrency(fund.totalDistributed) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditFund(fund)}
                        title="Edit fund"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                        onClick={() => setDeleteFund(fund)}
                        title="Delete fund"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {funds.length} fund{funds.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Create Dialog */}
      <FundFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        fund={null}
      />

      {/* Edit Dialog */}
      <FundFormDialog
        open={!!editFund}
        onOpenChange={(open) => {
          if (!open) setEditFund(null);
        }}
        fund={
          editFund
            ? {
                id: editFund.id,
                name: editFund.name,
                description: editFund.description || "",
                vintageYear: editFund.vintageYear,
                targetSize: editFund.targetSize || "",
                totalCommitted: editFund.totalCommitted || "",
                totalCalled: editFund.totalCalled || "",
                totalDistributed: editFund.totalDistributed || "",
                status: editFund.status,
              }
            : null
        }
      />

      {/* Delete Dialog */}
      {deleteFund && (
        <DeleteFundDialog
          open={!!deleteFund}
          onOpenChange={(open) => {
            if (!open) setDeleteFund(null);
          }}
          fundId={deleteFund.id}
          fundName={deleteFund.name}
        />
      )}
    </div>
  );
}
