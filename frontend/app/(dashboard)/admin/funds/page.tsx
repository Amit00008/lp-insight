import { db } from "@/db";
import { funds } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminFundsTable } from "@/components/dashboard/admin-funds-table";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminFundsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          You need admin privileges to access fund management. Please contact
          your administrator.
        </p>
      </div>
    );
  }

  const allFunds = await db
    .select()
    .from(funds)
    .orderBy(desc(funds.vintageYear));

  // Serialize dates for client component
  const serializedFunds = allFunds.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Fund Management</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Create, edit, and manage funds. Changes are reflected across the entire
          portal.
        </p>
      </div>

      {/* Funds Table with CRUD */}
      <AdminFundsTable funds={serializedFunds} />
    </div>
  );
}
