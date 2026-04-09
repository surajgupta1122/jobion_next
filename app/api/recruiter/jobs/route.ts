export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { sendEmail } from "@/app/lib/mailer";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user: any = await getUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // Fetch jobs for this recruiter (assumes jobs.recruiter_id = users.id)
    const [rows]: any = await db.query(
      `
      SELECT
        j.id,
        r.name AS title,
        j.company,
        j.city,
        j.job_type,
        j.work_mode,
        j.vacancies,
        j.status,
        j.created_at,
        j.expires_at,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS totalApplications
      FROM jobs j
      LEFT JOIN job_roles r ON j.role_id = r.id
      WHERE j.recruiter_id = ?
      ORDER BY j.created_at DESC
      LIMIT 200
      `,
      [user.id],
    );

    return NextResponse.json({ ok: true, jobs: rows || [] });
  } catch (err: any) {
    console.error("Recruiter jobs error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user: any = await getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const role_id = Number(body.role_id);
    const company = String(body.company || "").trim();
    const job_type = String(body.job_type || "Full-time");
    const work_mode = String(body.work_mode || "Office");

    const country = String(body.country || "").trim();
    const state = String(body.state || "").trim();
    const city = String(body.city || "").trim();
    const locality = String(body.locality || "").trim();
    const vacancies = Number(body.vacancies || 0);

    const min_experience = Number(body.min_experience || 0);
    const max_experience = Number(body.max_experience || 0);
    const min_salary =
      body.min_salary === null || body.min_salary === undefined || body.min_salary === ""
        ? null
        : Number(body.min_salary);
    const max_salary =
      body.max_salary === null || body.max_salary === undefined || body.max_salary === ""
        ? null
        : Number(body.max_salary);

    const description = String(body.description || "").trim();
    const interview_address = String(body.interview_address || "").trim();
    const contact_email = String(body.contact_email || "").trim();
    const contact_phone = String(body.contact_phone || "").trim();
    const show_interview_address = body.show_interview_address !== false;
    const show_contact_phone = body.show_contact_phone !== false;

    const skills: string[] = Array.isArray(body.skills) ? body.skills : [];

    if (!role_id || !company || !state || !city || !description || !contact_email) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert job (pending by default)
    const [result]: any = await db.query(
      `
      INSERT INTO jobs
        (role_id, company, job_type, work_mode, country, state, city, locality,
         vacancies, min_experience, max_experience, min_salary, max_salary,
         description, interview_address, contact_email, contact_phone,
         show_interview_address, show_contact_phone,
         recruiter_id, status, created_at, posted_at, expires_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?,
         ?, 'pending', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [
        role_id,
        company,
        job_type,
        work_mode,
        country || null,
        state || null,
        city || null,
        locality || null,
        vacancies || 0,
        min_experience || 0,
        max_experience || 0,
        min_salary,
        max_salary,
        description,
        interview_address || null,
        contact_email,
        contact_phone || null,
        show_interview_address ? 1 : 0,
        show_contact_phone ? 1 : 0,
        user.id,
      ],
    );

    const jobId = result?.insertId;

    // Best-effort: map skills to job_tags/job_tag_map if those tables exist
    if (jobId && skills.length > 0) {
      for (const raw of skills) {
        const name = String(raw || "").trim();
        if (!name) continue;
        try {
          await db.query(`INSERT IGNORE INTO job_tags (name) VALUES (?)`, [name]);
          const [tagRows]: any = await db.query(`SELECT id FROM job_tags WHERE name = ? LIMIT 1`, [name]);
          const tagId = tagRows?.[0]?.id;
          if (tagId) {
            await db.query(
              `INSERT IGNORE INTO job_tag_map (job_id, tag_id) VALUES (?, ?)`,
              [jobId, tagId],
            );
          }
        } catch {
          // ignore tag mapping errors
        }
      }
    }

    // Email admin (best effort): new job pending approval
    if (jobId) {
      const adminTo =
        process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
      if (adminTo) {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobion.in";
          await sendEmail({
            to: adminTo,
            subject: `New job pending approval (#${jobId})`,
            text: `A new job was posted and is waiting for approval.\n\nCompany: ${company}\nCity: ${city}\nJob ID: ${jobId}\n\nReview: ${siteUrl}/admin/jobs (Pending tab)`,
          });
        } catch (e) {
          console.error("[email admin new job] failed:", e);
        }
      }
    }

    return NextResponse.json({ ok: true, jobId });
  } catch (err: any) {
    console.error("Recruiter create job error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

