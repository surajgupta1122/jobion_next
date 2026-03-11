export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded?.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      `SELECT id, name FROM job_roles ORDER BY name ASC`,
    );

    return NextResponse.json({ ok: true, roles: rows });
  } catch (err: any) {
    console.error("Admin job roles error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

