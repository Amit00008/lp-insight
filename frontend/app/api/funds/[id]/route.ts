import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { funds } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/funds/:id — Get a single fund
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [fund] = await db
    .select()
    .from(funds)
    .where(eq(funds.id, id))
    .limit(1);

  if (!fund) {
    return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  }

  return NextResponse.json({ fund });
}

// PUT /api/funds/:id — Update a fund
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
      name,
      description,
      vintageYear,
      targetSize,
      totalCommitted,
      totalCalled,
      totalDistributed,
      status,
    } = body;

    const [updated] = await db
      .update(funds)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(vintageYear !== undefined && { vintageYear }),
        ...(targetSize !== undefined && { targetSize }),
        ...(totalCommitted !== undefined && { totalCommitted }),
        ...(totalCalled !== undefined && { totalCalled }),
        ...(totalDistributed !== undefined && { totalDistributed }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      })
      .where(eq(funds.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    return NextResponse.json({ fund: updated });
  } catch (error) {
    console.error("Update fund error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/funds/:id — Delete a fund
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
    .delete(funds)
    .where(eq(funds.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
