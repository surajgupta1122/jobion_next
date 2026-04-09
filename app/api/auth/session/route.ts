export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import db from "@/app/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ user: null });
    }

    const userId = decoded?.id;
    if (!userId) return NextResponse.json({ user: null });

    const [rows]: any = await db.query(
      "SELECT id, email, role, name, created_at, last_login FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    const user = rows?.[0] ?? null;

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}