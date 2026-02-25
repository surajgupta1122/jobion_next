import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET() {
  try {
    const [jobs]: any = await db.query(`
      SELECT 
        j.id,
        j.company,
        j.city,
        j.job_type,
        j.work_mode,
        j.min_experience,
        j.max_experience,
        j.min_salary,
        j.max_salary,
        j.description,
        j.vacancies,
        r.name AS roleName
      FROM jobs j
      LEFT JOIN job_roles r ON j.role_id = r.id
      WHERE j.status IN ('approved','pending')
      ORDER BY j.created_at DESC
    `);
    console.log(`📄 fetched ${jobs.length} jobs from database`);

    const [tags]: any = await db.query(`
      SELECT jtm.job_id, jt.name
      FROM job_tag_map jtm
      JOIN job_tags jt ON jt.id = jtm.tag_id
    `);

    const mapped = jobs.map((job: any) => ({
      id: job.id,
      title: job.roleName,
      company: job.company,
      location: job.city,
      type: job.job_type,
      workMode: job.work_mode,
      minExperience: job.min_experience,
      maxExperience: job.max_experience,
      minSalary: job.min_salary,
      maxSalary: job.max_salary,
      vacancies: job.vacancies,
      description: job.description,
      tags: tags
        .filter((t: any) => t.job_id === job.id)
        .map((t: any) => t.name),
    }));

    return NextResponse.json({ ok: true, jobs: mapped });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, message: err.message });
  }
}
