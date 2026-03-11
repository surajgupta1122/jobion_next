import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { getUser } from "../../../../lib/auth";

// GET
export async function GET(req: Request, { params }: any) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ isSaved: false });

  const [rows]: any = await db.query(
    `SELECT * FROM saved_jobs WHERE user_id=? AND job_id=?`,
    [user.id, id],
  );

  return NextResponse.json({ isSaved: rows.length > 0 });
}

// POST
export async function POST(req: Request, { params }: any) {
  const { id } = await params;
  const user = await getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await db.query(
    `INSERT IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)`,
    [user.id, id],
  );

  return NextResponse.json({ ok: true });
}

// DELETE
export async function DELETE(req: Request, { params }: any) {
  const { id } = await params;
  const user = await getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await db.query(`DELETE FROM saved_jobs WHERE user_id=? AND job_id=?`, [
    user.id,
    id,
  ]);

  return NextResponse.json({ ok: true });
}
