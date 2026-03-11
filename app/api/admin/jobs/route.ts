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

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "all").toLowerCase();

    const where =
      status === "all"
        ? ""
        : "WHERE j.status = ?";

    const params: any[] = status === "all" ? [] : [status];

    const [rows]: any = await db.query(
      `
      SELECT
        j.id,
        r.name AS title,
        j.job_type,
        j.min_experience,
        j.max_experience,
        j.min_salary,
        j.max_salary,
        j.company,
        j.city,
        j.state,
        j.created_at,
        j.status,
        u.email AS recruiter_email
      FROM jobs j
      LEFT JOIN job_roles r ON j.role_id = r.id
      LEFT JOIN users u ON u.id = j.recruiter_id
      ${where}
      ORDER BY j.created_at DESC
      LIMIT 200
      `,
      params,
    );

    return NextResponse.json({ ok: true, jobs: rows });
  } catch (err: any) {
    console.error("Admin jobs error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

