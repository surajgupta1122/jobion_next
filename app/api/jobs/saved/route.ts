import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { getUser } from "../../../lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ saved: [] });

  const [rows]: any = await db.query(
    `SELECT job_id FROM saved_jobs WHERE user_id=?`,
    [user.id],
  );

  return NextResponse.json({
    saved: rows.map((r: any) => r.job_id),
  });
}
