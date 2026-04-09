export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUser } from "@/app/lib/auth";

async function getAdminOrNull() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded?.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request, context: any) {
  void req;
  const params = await context.params;
  const jobId = Number(params?.id);
  if (!jobId || !Number.isFinite(jobId)) {
    return NextResponse.json({ ok: false, message: "Invalid job id" }, { status: 400 });
  }

  const admin = await getAdminOrNull();
  const user: any = admin ? null : await getUser();

  if (!admin && !user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!admin && user?.role && String(user.role).toLowerCase() !== "recruiter") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const [rows]: any = await db.query(
      `SELECT id, recruiter_id, expires_at, status FROM jobs WHERE id = ? LIMIT 1`,
      [jobId],
    );
    const job = rows?.[0];
    if (!job) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }

    if (!admin && Number(job.recruiter_id) !== Number(user?.id)) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    if (!job.expires_at) {
      return NextResponse.json(
        { ok: false, message: "Job has no expiry date to renew" },
        { status: 400 },
      );
    }

    const exp = new Date(job.expires_at);
    if (Number.isNaN(exp.getTime())) {
      return NextResponse.json(
        { ok: false, message: "Invalid job expiry date" },
        { status: 400 },
      );
    }

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const renewWindowStart = exp.getTime() - sevenDaysMs;

    // Allowed only within 7 days before expiry (and also allowed after expiry).
    if (now < renewWindowStart) {
      return NextResponse.json(
        { ok: false, message: "Renewal is allowed only within 7 days of expiry" },
        { status: 400 },
      );
    }

    await db.query(
      `
      UPDATE jobs
      SET
        expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY),
        posted_at = NOW()
      WHERE id = ?
      `,
      [jobId],
    );

    const [updated]: any = await db.query(
      `SELECT id, expires_at, posted_at, status FROM jobs WHERE id = ? LIMIT 1`,
      [jobId],
    );

    return NextResponse.json({ ok: true, job: updated?.[0] || null });
  } catch (err: any) {
    console.error("[API /api/jobs/[id]/renew] error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

