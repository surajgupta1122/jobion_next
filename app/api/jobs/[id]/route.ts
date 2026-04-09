import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request, context: any) {
  const params = await context.params;
  console.log("[API /api/jobs/[id]] params.id:", params.id);
  try {
    // Try both 'id' and '_id' for compatibility
    let [rows]: any = await db.query(
      `
      SELECT j.*, r.name AS roleName
      FROM jobs j
      LEFT JOIN job_roles r ON j.role_id = r.id
      WHERE j.id = ?
    `,
      [params.id],
    );
    let idColumn = "id";

    // If not found, try '_id' (for Mongo-style schemas)
    if (rows.length === 0) {
      [rows] = await db.query(
        `
        SELECT j.*, r.name AS roleName
        FROM jobs j
        LEFT JOIN job_roles r ON j.role_id = r.id
        WHERE j._id = ?
      `,
        [params.id],
      );
      idColumn = "_id";
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, message: "Not found" });
    }

    // Option A: treat expired jobs as removed
    if (rows?.[0]?.expires_at) {
      const exp = new Date(rows[0].expires_at);
      if (!Number.isNaN(exp.getTime()) && exp.getTime() <= Date.now()) {
        return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
      }
    }

    // Use the same id column for tags
    const [tags]: any = await db.query(
      `
      SELECT jt.name
      FROM job_tag_map jtm
      JOIN job_tags jt ON jt.id = jtm.tag_id
      WHERE jtm.job_id = ?
    `,
      [rows[0][idColumn]],
    );

    const jobData = rows[0];
    
    return NextResponse.json({
      ok: true,
      job: {
        id: jobData.id,
        _id: jobData._id,
        role_id: jobData.role_id,
        title: jobData.roleName, // Add title field
        roleName: jobData.roleName,
        company: jobData.company,
        job_type: jobData.job_type,
        work_mode: jobData.work_mode,
        city: jobData.city,
        state: jobData.state,
        country: jobData.country,
        locality: jobData.locality,
        min_experience: jobData.min_experience,
        max_experience: jobData.max_experience,
        min_salary: jobData.min_salary,
        max_salary: jobData.max_salary,
        vacancies: jobData.vacancies,
        description: jobData.description,
        interview_address: jobData.interview_address,
        contact_email: jobData.contact_email,
        contact_phone: jobData.contact_phone,
        logo_path: jobData.logo_path,
        recruiter_id: jobData.recruiter_id,
        status: jobData.status,
        posted_at: jobData.posted_at,
        expires_at: jobData.expires_at,
        show_interview_address: jobData.show_interview_address,
        show_contact_phone: jobData.show_contact_phone,
        skills: tags.map((t: any) => t.name),
      },
    });
  } catch (err: any) {
    console.error("[API /api/jobs/[id]] error:", err);
    return NextResponse.json({ ok: false, message: err.message });
  }
}