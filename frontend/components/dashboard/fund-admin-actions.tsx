"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { FundFormDialog } from "./fund-form-dialog";
import { DeleteFundDialog } from "./delete-fund-dialog";

interface FundData {
  id: string;
  name: string;
  description: string | null;
  vintageYear: number;
  targetSize: string | null;
  totalCommitted: string | null;
  totalCalled: string | null;
  totalDistributed: string | null;
  status: string;
}

export function FundAdminActions({ fund }: { fund: FundData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      </div>

      <FundFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        fund={{
          id: fund.id,
          name: fund.name,
          description: fund.description || "",
          vintageYear: fund.vintageYear,
          targetSize: fund.targetSize || "",
          totalCommitted: fund.totalCommitted || "",
          totalCalled: fund.totalCalled || "",
          totalDistributed: fund.totalDistributed || "",
          status: fund.status,
        }}
      />

      <DeleteFundDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        fundId={fund.id}
        fundName={fund.name}
      />
    </>
  );
}
