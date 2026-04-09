export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getUser } from "@/app/lib/auth";
import { sendEmail } from "@/app/lib/mailer";

function asStatus(raw: unknown): "shortlisted" | "rejected" | null {
  const v = String(raw || "").toLowerCase().trim();
  if (v === "shortlisted" || v === "rejected") return v;
  return null;
}

export async function PATCH(req: Request, context: any) {
  const user: any = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (user.role && String(user.role).toLowerCase() !== "recruiter") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  const applicationId = Number(params?.id);
  if (!applicationId || !Number.isFinite(applicationId)) {
    return NextResponse.json({ ok: false, message: "Invalid application id" }, { status: 400 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const nextStatus = asStatus(body?.status);
  if (!nextStatus) {
    return NextResponse.json(
      { ok: false, message: "Invalid status" },
      { status: 400 },
    );
  }

  try {
    // Ensure recruiter owns the job for this application
    const [rows]: any = await db.query(
      `
      SELECT
        ja.id,
        ja.user_id AS candidate_user_id,
        COALESCE(ja.status,'applied') AS current_status,
        ja.job_id,
        j.recruiter_id,
        r.name AS job_title,
        j.company
      FROM job_applications ja
      INNER JOIN jobs j ON j.id = ja.job_id
      LEFT JOIN job_roles r ON r.id = j.role_id
      WHERE ja.id = ?
      LIMIT 1
      `,
      [applicationId],
    );
    const row = rows?.[0];
    if (!row) {
      return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
    }
    if (Number(row.recruiter_id) !== Number(user.id)) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    const current = String(row.current_status || "applied");
    if (current !== "applied") {
      // Enforce applied -> shortlisted/rejected lifecycle
      return NextResponse.json(
        { ok: false, message: `Cannot change status from ${current}` },
        { status: 400 },
      );
    }

    await db.query(
      `UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?`,
      [nextStatus, applicationId],
    );

    // Notify candidate (best effort)
    const jobTitle = row.job_title || "your job";
    const company = row.company || "";
    const title =
      nextStatus === "shortlisted"
        ? "Application shortlisted"
        : "Application update";
    const message =
      nextStatus === "shortlisted"
        ? `Good news! You’ve been shortlisted for ${jobTitle}${company ? ` at ${company}` : ""}.`
        : `Your application status was updated for ${jobTitle}${company ? ` at ${company}` : ""}.`;

    try {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'application_status', ?, ?, 0, NOW())`,
        [row.candidate_user_id, title, message],
      );
    } catch {
      // ignore notifications errors
    }

    // Email candidate (best effort): shortlisted/rejected update
    try {
      const [uRows]: any = await db.query(`SELECT email FROM users WHERE id = ? LIMIT 1`, [
        row.candidate_user_id,
      ]);
      const candidateEmail = uRows?.[0]?.email;
      if (candidateEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobion.in";
        await sendEmail({
          to: candidateEmail,
          subject: title,
          text: `${message}\n\nView your applications: ${siteUrl}/dashboard/applied`,
        });
      }
    } catch (e) {
      console.error("[email candidate status] failed:", e);
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (err: any) {
    console.error("[API /api/recruiter/applications/[id]/status] error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

