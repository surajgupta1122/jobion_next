export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getUser } from "@/app/lib/auth";

function asStatus(raw: unknown): "applied" | "shortlisted" | "rejected" | null {
  const v = String(raw || "").toLowerCase().trim();
  if (v === "applied" || v === "shortlisted" || v === "rejected") return v;
  return null;
}

export async function GET(req: Request, context: any) {
  const user: any = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (user.role && String(user.role).toLowerCase() !== "recruiter") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  const jobId = Number(params?.id);
  if (!jobId || !Number.isFinite(jobId)) {
    return NextResponse.json({ ok: false, message: "Invalid job id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const status = asStatus(url.searchParams.get("status"));

  try {
    // Ensure recruiter owns the job
    const [jobRows]: any = await db.query(
      `SELECT id, recruiter_id, company, city, state, status
       FROM jobs
       WHERE id = ? LIMIT 1`,
      [jobId],
    );
    const job = jobRows?.[0];
    if (!job) {
      return NextResponse.json({ ok: false, message: "Job not found" }, { status: 404 });
    }
    if (Number(job.recruiter_id) !== Number(user.id)) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    const statusFilterSql = status ? " AND COALESCE(ja.status,'applied') = ? " : "";
    const args: any[] = [jobId];
    if (status) args.push(status);

    const [rows]: any = await db.query(
      `
      SELECT
        ja.id AS application_id,
        ja.job_id,
        ja.user_id,
        COALESCE(ja.status,'applied') AS status,
        ja.cover_letter,
        ja.resume_path AS application_resume_path,
        ja.applied_at,
        u.email,
        u.name,
        cp.full_name,
        cp.phone,
        cp.date_of_birth,
        cp.city,
        cp.state,
        cp.country,
        cp.highest_qualification,
        cp.trade_stream,
        cp.availability,
        cp.experience_years,
        cp.linkedin_url,
        cp.github_url,
        cp.resume_path AS profile_resume_path
      FROM job_applications ja
      INNER JOIN jobs j ON j.id = ja.job_id
      INNER JOIN users u ON u.id = ja.user_id
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      WHERE ja.job_id = ?
      ${statusFilterSql}
      ORDER BY ja.id DESC
      LIMIT 500
      `,
      args,
    );

    const applicants = (rows || []).map((r: any) => ({
      application_id: r.application_id,
      job_id: r.job_id,
      user_id: r.user_id,
      status: r.status,
      applied_at: r.applied_at,
      cover_letter: r.cover_letter,
      resume_path: r.application_resume_path || r.profile_resume_path || null,
      candidate: {
        name: r.full_name || r.name || "Candidate",
        email: r.email || "",
        phone: r.phone || "",
        date_of_birth: r.date_of_birth || null,
        location: [r.city, r.state, r.country].filter(Boolean).join(", "),
        availability: r.availability || null,
        experience_years: r.experience_years ?? null,
        highest_qualification: r.highest_qualification ?? null,
        trade_stream: r.trade_stream ?? null,
        linkedin_url: r.linkedin_url ?? null,
        github_url: r.github_url ?? null,
      },
    }));

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        company: job.company,
        city: job.city,
        state: job.state,
        status: job.status,
      },
      applicants,
    });
  } catch (err: any) {
    console.error("[API /api/recruiter/jobs/[id]/applicants] error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

