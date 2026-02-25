import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request, { params }: any) {
  try {
    const [rows]: any = await db.query(`
      SELECT j.*, r.name AS roleName
      FROM jobs j
      LEFT JOIN job_roles r ON j.role_id = r.id
      WHERE j.id = ?
    `, [params.id]);

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, message: "Not found" });
    }

    const [tags]: any = await db.query(`
      SELECT jt.name
      FROM job_tag_map jtm
      JOIN job_tags jt ON jt.id = jtm.tag_id
      WHERE jtm.job_id = ?
    `, [params.id]);

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