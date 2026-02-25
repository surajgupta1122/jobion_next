import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { getUser } from "../../../../lib/auth";

export async function POST(req: Request, { params }: any) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await db.query(
      `INSERT INTO job_applications (job_id, user_id) VALUES (?, ?)`,
      [params.id, user.id],
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message });
  }
}
