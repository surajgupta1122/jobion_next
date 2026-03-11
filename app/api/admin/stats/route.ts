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

    const [[usersRow]]: any = await db.query(
      `SELECT COUNT(*) AS totalUsers FROM users`,
    );

    const [[jobsRow]]: any = await db.query(
      `SELECT COUNT(*) AS totalJobs FROM jobs`,
    );

    let recruiters = 0;
    let verifiedRecruiters = 0;
    try {
      const [[recRow]]: any = await db.query(
        `SELECT COUNT(*) AS recruiters FROM users WHERE role = 'recruiter'`,
      );
      recruiters = Number(recRow?.recruiters) || 0;
    } catch {}

    try {
      const [[verRow]]: any = await db.query(
        `SELECT COUNT(*) AS verifiedRecruiters
         FROM recruiter_profiles
         WHERE verification_status = 'verified' OR is_verified = 1`,
      );
      verifiedRecruiters = Number(verRow?.verifiedRecruiters) || 0;
    } catch {}

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: Number(usersRow?.totalUsers) || 0,
        totalJobs: Number(jobsRow?.totalJobs) || 0,
        recruiters,
        verifiedRecruiters,
      },
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

