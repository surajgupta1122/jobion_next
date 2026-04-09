import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getUser } from "@/app/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", applications: [] },
      { status: 401 },
    );
  }

  try {
    // Try richer query first (schemas may vary between applied_at vs created_at columns)
    try {
      const [rows]: any = await db.query(
        `
        SELECT
          ja.id,
          ja.job_id,
          r.name AS title,
          j.company,
          COALESCE(ja.status, 'applied') AS status,
          j.city,
          j.locality,
          j.job_type,
          CASE
            WHEN j.min_salary IS NOT NULL AND j.max_salary IS NOT NULL THEN CONCAT(j.min_salary, ' - ', j.max_salary)
            WHEN j.min_salary IS NOT NULL THEN CONCAT(j.min_salary, '+')
            WHEN j.max_salary IS NOT NULL THEN CONCAT('Up to ', j.max_salary)
            ELSE NULL
          END AS salary,
          ja.applied_at AS applied_at
        FROM job_applications ja
        INNER JOIN jobs j ON j.id = ja.job_id
        LEFT JOIN job_roles r ON r.id = j.role_id
        WHERE ja.user_id = ?
        ORDER BY ja.id DESC
      `,
        [user.id],
      );

      return NextResponse.json({ ok: true, applications: rows || [] });
    } catch {
      // Retry with created_at (some schemas use created_at instead of applied_at)
      try {
        const [rows]: any = await db.query(
          `
          SELECT
            ja.id,
            ja.job_id,
            r.name AS title,
            j.company,
            COALESCE(ja.status, 'applied') AS status,
            j.city,
            j.locality,
            j.job_type,
            CASE
              WHEN j.min_salary IS NOT NULL AND j.max_salary IS NOT NULL THEN CONCAT(j.min_salary, ' - ', j.max_salary)
              WHEN j.min_salary IS NOT NULL THEN CONCAT(j.min_salary, '+')
              WHEN j.max_salary IS NOT NULL THEN CONCAT('Up to ', j.max_salary)
              ELSE NULL
            END AS salary,
            ja.created_at AS applied_at
          FROM job_applications ja
          INNER JOIN jobs j ON j.id = ja.job_id
          LEFT JOIN job_roles r ON r.id = j.role_id
          WHERE ja.user_id = ?
          ORDER BY ja.id DESC
        `,
          [user.id],
        );

        return NextResponse.json({ ok: true, applications: rows || [] });
      } catch {
        // Fallback query for minimal schemas
      }

      const [rows]: any = await db.query(
        `
        SELECT
          ja.id,
          ja.job_id,
          r.name AS title,
          j.company,
          j.city,
          j.locality,
          j.job_type
        FROM job_applications ja
        INNER JOIN jobs j ON j.id = ja.job_id
        LEFT JOIN job_roles r ON r.id = j.role_id
        WHERE ja.user_id = ?
        ORDER BY ja.id DESC
      `,
        [user.id],
      );

      const applications = (rows || []).map((row: any) => ({
        ...row,
        status: "applied",
        salary: null,
        applied_at: "",
      }));

      return NextResponse.json({ ok: true, applications });
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to load applications" },
      { status: 500 },
    );
  }
}

