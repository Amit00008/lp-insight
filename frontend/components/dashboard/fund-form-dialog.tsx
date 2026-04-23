"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface FundData {
  id?: string;
  name: string;
  description: string;
  vintageYear: number;
  targetSize: string;
  totalCommitted: string;
  totalCalled: string;
  totalDistributed: string;
  status: string;
}

const emptyFund: FundData = {
  name: "",
  description: "",
  vintageYear: new Date().getFullYear(),
  targetSize: "",
  totalCommitted: "",
  totalCalled: "",
  totalDistributed: "",
  status: "active",
};

interface FundFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund?: FundData | null;
  onSuccess?: () => void;
}

export function FundFormDialog({
  open,
  onOpenChange,
  fund,
  onSuccess,
}: FundFormDialogProps) {
  const router = useRouter();
  const isEditing = !!fund?.id;
  const [formData, setFormData] = useState<FundData>(emptyFund);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (fund) {
        setFormData({
          id: fund.id,
          name: fund.name || "",
          description: fund.description || "",
          vintageYear: fund.vintageYear || new Date().getFullYear(),
          targetSize: fund.targetSize || "",
          totalCommitted: fund.totalCommitted || "",
          totalCalled: fund.totalCalled || "",
          totalDistributed: fund.totalDistributed || "",
          status: fund.status || "active",
        });
      } else {
        setFormData(emptyFund);
      }
      setError("");
    }
  }, [open, fund]);

  function updateField(field: keyof FundData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        vintageYear: Number(formData.vintageYear),
        targetSize: formData.targetSize || null,
        totalCommitted: formData.totalCommitted || null,
        totalCalled: formData.totalCalled || null,
        totalDistributed: formData.totalDistributed || "0",
        status: formData.status,
      };

      if (!payload.name) {
        setError("Fund name is required");
        setLoading(false);
        return;
      }

      if (!payload.vintageYear || payload.vintageYear < 1990 || payload.vintageYear > 2050) {
        setError("Please enter a valid vintage year (1990-2050)");
        setLoading(false);
        return;
      }

      const url = isEditing ? `/api/funds/${fund!.id}` : "/api/funds";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Fund" : "Create New Fund"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the fund details below."
              : "Fill in the details to create a new fund."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Fund Name */}
          <div className="space-y-2">
            <Label htmlFor="fund-name">Fund Name *</Label>
            <Input
              id="fund-name"
              placeholder="e.g. Accelerator Fund III"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="fund-desc">Description</Label>
            <Textarea
              id="fund-desc"
              placeholder="Brief description of the fund strategy..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
            />
          </div>

          {/* Vintage Year + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fund-vintage">Vintage Year *</Label>
              <Input
                id="fund-vintage"
                type="number"
                min={1990}
                max={2050}
                value={formData.vintageYear}
                onChange={(e) => updateField("vintageYear", parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => updateField("status", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fund-target">Target Size ($)</Label>
              <Input
                id="fund-target"
                type="number"
                step="0.01"
                min="0"
                placeholder="100000000"
                value={formData.targetSize}
                onChange={(e) => updateField("targetSize", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-committed">Total Committed ($)</Label>
              <Input
                id="fund-committed"
                type="number"
                step="0.01"
                min="0"
                placeholder="85000000"
                value={formData.totalCommitted}
                onChange={(e) => updateField("totalCommitted", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fund-called">Capital Called ($)</Label>
              <Input
                id="fund-called"
                type="number"
                step="0.01"
                min="0"
                placeholder="50000000"
                value={formData.totalCalled}
                onChange={(e) => updateField("totalCalled", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-distributed">Distributions ($)</Label>
              <Input
                id="fund-distributed"
                type="number"
                step="0.01"
                min="0"
                placeholder="15000000"
                value={formData.totalDistributed}
                onChange={(e) => updateField("totalDistributed", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Fund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
