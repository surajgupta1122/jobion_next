import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { getUser } from "../../../../lib/auth";
import { sendEmail } from "@/app/lib/mailer";

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

    // Email recruiter (best effort): new applicant applied
    try {
      const [rows]: any = await db.query(
        `
        SELECT
          u.email AS recruiter_email,
          r.name AS job_title,
          j.company
        FROM jobs j
        LEFT JOIN users u ON u.id = j.recruiter_id
        LEFT JOIN job_roles r ON r.id = j.role_id
        WHERE j.id = ?
        LIMIT 1
      `,
        [jobId],
      );
      const recEmail = rows?.[0]?.recruiter_email;
      if (recEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobion.in";
        await sendEmail({
          to: recEmail,
          subject: `New application received: ${rows?.[0]?.job_title || "Job"} (${rows?.[0]?.company || ""})`,
          text: `You received a new application.\n\nJob: ${rows?.[0]?.job_title || "Job"}\nCompany: ${rows?.[0]?.company || ""}\n\nView applicants: ${siteUrl}/recruiter/jobs/${jobId}/applicants`,
        });
      }
    } catch (e) {
      console.error("[email recruiter new application] failed:", e);
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
