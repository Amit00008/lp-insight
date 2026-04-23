import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { getSession } from "@/lib/auth";

// POST /api/positions — Create a new position
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
      fundId,
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

    if (!fundId || !companyName || !initialInvestment || !currentValue || !costBasis || !investmentDate) {
      return NextResponse.json(
        { error: "fundId, companyName, initialInvestment, currentValue, costBasis, and investmentDate are required" },
        { status: 400 }
      );
    }

    const [position] = await db
      .insert(positions)
      .values({
        fundId,
        companyName,
        sector: sector || null,
        stage: stage || null,
        initialInvestment,
        currentValue,
        costBasis,
        shares: shares || null,
        ownershipPct: ownershipPct || null,
        investmentDate,
        status: status || "active",
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ position }, { status: 201 });
  } catch (error) {
    console.error("Create position error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
