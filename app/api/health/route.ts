// app/api/health/route.ts

import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET() {
  try {
    await db.query("SELECT 1");

    return NextResponse.json({
      status: "MySQL Connected ✅",
    });
  } catch (error: any) {
    console.error("DB Error:", error);

    return NextResponse.json(
      {
        status: "Connection Failed ❌",
        error: error.message,
      },
      { status: 500 }
    );
  }
}