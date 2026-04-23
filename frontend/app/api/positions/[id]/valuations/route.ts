import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations, positions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/positions/:id/valuations — List all valuations for a position
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify position exists
  const [position] = await db
    .select()
    .from(positions)
    .where(eq(positions.id, id))
    .limit(1);

  if (!position) {
    return NextResponse.json(
      { error: "Position not found" },
      { status: 404 }
    );
  }

  const positionValuations = await db
    .select()
    .from(valuations)
    .where(eq(valuations.positionId, id))
    .orderBy(asc(valuations.valuationDate));

  return NextResponse.json({ valuations: positionValuations });
}

// POST /api/positions/:id/valuations — Add a valuation snapshot
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
    const { valuationDate, value, source, notes } = body;

    if (!valuationDate || !value) {
      return NextResponse.json(
        { error: "valuationDate and value are required" },
        { status: 400 }
      );
    }

    // Verify position exists
    const [position] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, id))
      .limit(1);

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    const [valuation] = await db
      .insert(valuations)
      .values({
        positionId: id,
        valuationDate,
        value,
        source: source || null,
        notes: notes || null,
      })
      .returning();

    // Also update the position's current value to the latest valuation
    await db
      .update(positions)
      .set({
        currentValue: value,
        updatedAt: new Date(),
      })
      .where(eq(positions.id, id));

    return NextResponse.json({ valuation }, { status: 201 });
  } catch (error) {
    console.error("Create valuation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
