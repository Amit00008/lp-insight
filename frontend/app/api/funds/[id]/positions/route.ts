import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { positions, funds } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/funds/:id/positions — List all positions for a fund
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify fund exists
  const [fund] = await db
    .select()
    .from(funds)
    .where(eq(funds.id, id))
    .limit(1);

  if (!fund) {
    return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  }

  const fundPositions = await db
    .select()
    .from(positions)
    .where(eq(positions.fundId, id))
    .orderBy(positions.companyName);

  return NextResponse.json({ positions: fundPositions });
}
