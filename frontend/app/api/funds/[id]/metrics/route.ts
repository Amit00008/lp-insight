import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fundMetrics, funds } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/funds/:id/metrics — List all metrics for a fund (chronological)
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

  const metrics = await db
    .select()
    .from(fundMetrics)
    .where(eq(fundMetrics.fundId, id))
    .orderBy(asc(fundMetrics.date));

  return NextResponse.json({ metrics });
}

// POST /api/funds/:id/metrics — Add a metric snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { date, nav, irr, tvpi, dpi, rvpi } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const [metric] = await db
      .insert(fundMetrics)
      .values({
        fundId: id,
        date,
        nav: nav || null,
        irr: irr || null,
        tvpi: tvpi || null,
        dpi: dpi || null,
        rvpi: rvpi || null,
      })
      .returning();

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error("Create fund metric error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
