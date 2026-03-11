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
    const status = (searchParams.get("status") || "pending").toLowerCase();

    // We try multiple schema variants for verification fields.
    // If columns don't exist, the query may fail; in that case, return empty list.
    let rows: any[] = [];
    try {
      const where =
        status === "verified"
          ? `(rp.verification_status = 'verified' OR rp.is_verified = 1)`
          : `(rp.verification_status = 'pending' OR rp.is_verified = 0 OR rp.verification_status IS NULL)`;

      const [result]: any = await db.query(
        `
        SELECT
          rp.id,
          rp.company_name,
          rp.company_type,
          rp.website,
          rp.hr_name,
          rp.hr_mobile,
          rp.city,
          rp.state,
          rp.country,
          rp.verification_status,
          rp.is_verified,
          u.email
        FROM recruiter_profiles rp
        LEFT JOIN users u ON u.id = rp.user_id
        WHERE ${where}
        ORDER BY rp.id DESC
        LIMIT 500
        `,
      );
      rows = result;
    } catch {
      rows = [];
    }

    return NextResponse.json({ ok: true, recruiters: rows });
  } catch (err: any) {
    console.error("Admin recruiters error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

