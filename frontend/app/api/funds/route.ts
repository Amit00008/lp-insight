import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { funds } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

// GET /api/funds — List all funds
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allFunds = await db
    .select()
    .from(funds)
    .orderBy(desc(funds.vintageYear));

  return NextResponse.json({ funds: allFunds });
}

// POST /api/funds — Create a new fund
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

    if (!name || !vintageYear) {
      return NextResponse.json(
        { error: "Name and vintage year are required" },
        { status: 400 }
      );
    }

    const [newFund] = await db
      .insert(funds)
      .values({
        name,
        description: description || null,
        vintageYear,
        targetSize: targetSize || null,
        totalCommitted: totalCommitted || null,
        totalCalled: totalCalled || null,
        totalDistributed: totalDistributed || "0",
        status: status || "active",
      })
      .returning();

    return NextResponse.json({ fund: newFund }, { status: 201 });
  } catch (error) {
    console.error("Create fund error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
