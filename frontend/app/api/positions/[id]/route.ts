import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { positions, valuations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/positions/:id — Get a single position with its valuations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [position] = await db
    .select()
    .from(positions)
    .where(eq(positions.id, id))
    .limit(1);

  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  const positionValuations = await db
    .select()
    .from(valuations)
    .where(eq(valuations.positionId, id))
    .orderBy(asc(valuations.valuationDate));

  return NextResponse.json({
    position,
    valuations: positionValuations,
  });
}

// PUT /api/positions/:id — Update a position
export async function PUT(
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
    const {
      companyName,
      sector,
      stage,
      initialInvestment,
      currentValue,
      costBasis,
      shares,
      ownershipPct,
      investmentDate,
      status,
      notes,
    } = body;

    const [updated] = await db
      .update(positions)
      .set({
        ...(companyName !== undefined && { companyName }),
        ...(sector !== undefined && { sector }),
        ...(stage !== undefined && { stage }),
        ...(initialInvestment !== undefined && { initialInvestment }),
        ...(currentValue !== undefined && { currentValue }),
        ...(costBasis !== undefined && { costBasis }),
        ...(shares !== undefined && { shares }),
        ...(ownershipPct !== undefined && { ownershipPct }),
        ...(investmentDate !== undefined && { investmentDate }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(positions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ position: updated });
  } catch (error) {
    console.error("Update position error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/positions/:id — Delete a position (cascades valuations)
export async function DELETE(
  _request: NextRequest,
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

  const [deleted] = await db
    .delete(positions)
    .where(eq(positions.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { error: "Position not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
