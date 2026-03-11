import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getUser } from "@/app/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: [] },
      { status: 401 },
    );
  }

  try {
    // Prefer a richer query (includes location, logo, experience, salary),
    // but fall back for schemas that don't have all optional columns.
    try {
      const [rows]: any = await db.query(
        `
        SELECT
          sj.job_id AS id,
          sj.job_id,
          sj.saved_at,
          r.name AS title,
          j.company,
          j.job_type AS type,
          j.logo_path,
          CONCAT_WS(', ', j.city, j.locality) AS location,
          CASE
            WHEN j.min_experience IS NOT NULL AND j.max_experience IS NOT NULL THEN CONCAT(j.min_experience, ' - ', j.max_experience, ' yrs')
            WHEN j.min_experience IS NOT NULL THEN CONCAT(j.min_experience, '+ yrs')
            WHEN j.max_experience IS NOT NULL THEN CONCAT('Up to ', j.max_experience, ' yrs')
            ELSE NULL
          END AS experience,
          CASE
            WHEN j.min_salary IS NOT NULL AND j.max_salary IS NOT NULL THEN CONCAT(j.min_salary, ' - ', j.max_salary)
            WHEN j.min_salary IS NOT NULL THEN CONCAT(j.min_salary, '+')
            WHEN j.max_salary IS NOT NULL THEN CONCAT('Up to ', j.max_salary)
            ELSE NULL
          END AS salary
        FROM saved_jobs sj
        INNER JOIN jobs j ON j.id = sj.job_id
        LEFT JOIN job_roles r ON r.id = j.role_id
        WHERE sj.user_id = ?
        ORDER BY sj.saved_at DESC, sj.job_id DESC
      `,
        [user.id],
      );

      return NextResponse.json({ success: true, data: rows || [] });
    } catch (richErr: any) {
      console.warn("[API /api/jobs/saved-jobs] rich query failed:", richErr);

      const [rows]: any = await db.query(
        `
        SELECT
          sj.job_id AS id,
          sj.job_id,
          sj.saved_at,
          r.name AS title,
          j.company,
          j.job_type AS type,
          j.city,
          NULL AS locality
        FROM saved_jobs sj
        INNER JOIN jobs j ON j.id = sj.job_id
        LEFT JOIN job_roles r ON r.id = j.role_id
        WHERE sj.user_id = ?
        ORDER BY sj.saved_at DESC, sj.job_id DESC
      `,
        [user.id],
      );

      const mapped = (rows || []).map((row: any) => ({
        ...row,
        location: [row.city, row.locality].filter(Boolean).join(", "),
        logo_path: row.logo_path ?? null,
        experience: null,
        salary: null,
      }));

      return NextResponse.json({ success: true, data: mapped });
    }
  } catch (err: any) {
    console.error("[API /api/jobs/saved-jobs] error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load saved jobs" },
      { status: 500 },
    );
  }
}

