export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user: any = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM candidate_profiles WHERE user_id = ?",
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: rows[0],
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}