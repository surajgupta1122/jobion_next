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

    return NextResponse.json({
      ok: true,
      job: {
        ...rows[0],
        skills: tags.map((t: any) => t.name),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
