import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [cities]: any = await db.query(`SELECT DISTINCT city FROM jobs`);

    const [roles]: any = await db.query(`SELECT id, name FROM job_roles`);

    const [tags]: any = await db.query(`SELECT name FROM job_tags`);
    console.log(
      `🔎 filters counts - cities:${cities.length}, roles:${roles.length}, tags:${tags.length}`,
    );

    return NextResponse.json({
      ok: true,
      filters: {
        cities: cities.map((c: any) => c.city),
        roles,
        tags: tags.map((t: any) => t.name),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
