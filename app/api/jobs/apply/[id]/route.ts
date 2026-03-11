import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { getUser } from "../../../../lib/auth";

export async function POST(req: Request, context: any) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const params = await context.params;
    const jobIdFromParams = params?.id;

    // Allow job_id to be provided via multipart/form-data as well (future-proof)
    let jobId: string | number | undefined = jobIdFromParams;
    try {
      const contentType = req.headers.get("content-type") || "";
      if (!jobId && contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        const jobIdFromBody = form.get("job_id");
        if (typeof jobIdFromBody === "string" && jobIdFromBody.trim()) {
          jobId = jobIdFromBody.trim();
        }
      }
    } catch {
      // ignore body parsing failures; params should be enough
    }

    if (!jobId) {
      return NextResponse.json(
        { ok: false, message: "Job ID missing" },
        { status: 400 },
      );
    }

    const [result]: any = await db.query(
      `INSERT IGNORE INTO job_applications (job_id, user_id) VALUES (?, ?)`,
      [jobId, user.id],
    );

    if (result?.affectedRows === 0) {
      return NextResponse.json({ ok: true, message: "Already applied" });
    }

    return NextResponse.json({ ok: true, message: "Applied" });
  } catch (err: any) {
    console.error("[API /api/jobs/apply/[id]] error:", err);
    return NextResponse.json(
      { ok: false, message: err.message || "Failed to apply" },
      { status: 500 },
    );
  }
}
