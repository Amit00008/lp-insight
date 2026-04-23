import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { valuations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PUT /api/valuations/:id — Update a valuation
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
    const { valuationDate, value, source, notes } = body;

    const [updated] = await db
      .update(valuations)
      .set({
        ...(valuationDate !== undefined && { valuationDate }),
        ...(value !== undefined && { value }),
        ...(source !== undefined && { source }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(valuations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Valuation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ valuation: updated });
  } catch (error) {
    console.error("Update valuation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/valuations/:id — Delete a valuation
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
    .delete(valuations)
    .where(eq(valuations.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { error: "Valuation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
