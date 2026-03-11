export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ ok: true, admin: null });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return NextResponse.json({ ok: true, admin: decoded });
    } catch {
      return NextResponse.json({ ok: true, admin: null });
    }
  } catch (err) {
    console.error("Admin session error:", err);
    return NextResponse.json({ ok: true, admin: null });
  }
}

