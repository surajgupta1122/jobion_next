export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getRecruiterUser(): Promise<{ id: number } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    return { id: decoded.id };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getRecruiterUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const recruiterId = user.id;

    // Job counts by status (jobs.recruiter_id may be user_id or recruiter_profile id - try user_id first)
    const [jobCounts]: any = await db.query(
      `SELECT
        COUNT(*) AS totalJobs,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS liveJobs,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingJobs,
        SUM(CASE WHEN status IN ('rejected', 'closed', 'expired') THEN 1 ELSE 0 END) AS closedJobs
      FROM jobs
      WHERE recruiter_id = ?`,
      [recruiterId]
    );

    const counts = jobCounts[0] || {};
    const totalJobs = Number(counts.totalJobs) || 0;
    const liveJobs = Number(counts.liveJobs) || 0;
    const pendingJobs = Number(counts.pendingJobs) || 0;
    const closedJobs = Number(counts.closedJobs) || 0;

    // Application counts for this recruiter's jobs (job_applications may not have status column)
    const [appCounts]: any = await db.query(
      `SELECT COUNT(*) AS totalApplications
       FROM job_applications ja
       INNER JOIN jobs j ON j.id = ja.job_id
       WHERE j.recruiter_id = ?`,
      [recruiterId]
    );
    const totalApplications = Number(appCounts[0]?.totalApplications) || 0;

    // Pending review = applications with status 'applied' or no status; shortlisted; rejected
    let pendingReview = totalApplications;
    let shortlisted = 0;
    let rejected = 0;
    try {
      const [statusCounts]: any = await db.query(
        `SELECT
          COALESCE(ja.status, 'applied') AS status,
          COUNT(*) AS cnt
         FROM job_applications ja
         INNER JOIN jobs j ON j.id = ja.job_id
         WHERE j.recruiter_id = ?
         GROUP BY COALESCE(ja.status, 'applied')`,
        [recruiterId]
      );
      pendingReview = 0;
      for (const row of statusCounts) {
        const c = Number(row.cnt) || 0;
        if (row.status === "applied") pendingReview += c;
        else if (row.status === "shortlisted") shortlisted += c;
        else if (row.status === "rejected") rejected += c;
        else pendingReview += c;
      }
    } catch {
      // If status column doesn't exist, all are pending review
    }

    // New applications (last 7 days) - if we have applied_at/created_at on job_applications
    let newApplications = totalApplications;
    try {
      const [newRows]: any = await db.query(
        `SELECT COUNT(*) AS cnt
         FROM job_applications ja
         INNER JOIN jobs j ON j.id = ja.job_id
         WHERE j.recruiter_id = ?
         AND (ja.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) OR ja.applied_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))`,
        [recruiterId]
      );
      newApplications = Number(newRows[0]?.cnt) ?? 0;
    } catch {
      newApplications = 0;
    }

    // Live jobs list (approved jobs with application counts)
    const [liveJobsRows]: any = await db.query(
      `SELECT j.id, r.name AS title, j.company, j.city,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) AS totalApplications,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id AND COALESCE(status,'applied') = 'applied') AS pendingCount
       FROM jobs j
       LEFT JOIN job_roles r ON j.role_id = r.id
       WHERE j.recruiter_id = ? AND j.status = 'approved'
       ORDER BY j.created_at DESC
       LIMIT 10`,
      [recruiterId]
    );

    const liveJobsList = (liveJobsRows || []).map((row: any) => ({
      id: row.id,
      title: row.title || "Job",
      company: row.company,
      city: row.city,
      totalApplications: Number(row.totalApplications) || 0,
      pendingCount: Number(row.pendingCount) || 0,
    }));

    // Recent applications (last 10) - use minimal columns to avoid missing-column errors
    let recentApplications: Array<{
      applicationId: string | number;
      jobId: string | number;
      applicantName: string;
      jobTitle: string;
      status: string;
      appliedAt: string;
    }> = [];
    try {
      const [recentRows]: any = await db.query(
        `SELECT ja.id AS applicationId, ja.job_id AS jobId, u.name AS applicantName, r.name AS jobTitle
         FROM job_applications ja
         INNER JOIN jobs j ON j.id = ja.job_id
         LEFT JOIN job_roles r ON j.role_id = r.id
         LEFT JOIN users u ON u.id = ja.user_id
         WHERE j.recruiter_id = ?
         ORDER BY ja.id DESC
         LIMIT 10`,
        [recruiterId]
      );
      recentApplications = (recentRows || []).map((row: any) => ({
        applicationId: row.applicationId,
        jobId: row.jobId,
        applicantName: row.applicantName || "Applicant",
        jobTitle: row.jobTitle || "Job",
        status: "applied",
        appliedAt: "",
      }));
    } catch {
      // tables might differ
    }

    // Recent activity (from applications)
    const recentActivity = recentApplications.map((app) => ({
      type: "new_application",
      message: `${app.applicantName} applied for ${app.jobTitle}`,
      timestamp: app.appliedAt,
    }));

    // Pending approval jobs (status = 'pending')
    const [pendingRows]: any = await db.query(
      `SELECT j.id, r.name AS title, j.company, j.created_at AS createdAt
       FROM jobs j
       LEFT JOIN job_roles r ON j.role_id = r.id
       WHERE j.recruiter_id = ? AND j.status = 'pending'
       ORDER BY j.created_at DESC
       LIMIT 5`,
      [recruiterId]
    );
    const pendingApprovalJobs = (pendingRows || []).map((row: any) => ({
      id: row.id,
      title: row.title || "Job",
      company: row.company,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
    }));

    const stats = {
      totalJobs,
      liveJobs,
      pendingJobs,
      closedJobs,
      totalApplications,
      pendingReview,
      shortlisted,
      rejected,
      newApplications,
      liveJobsList,
      recentApplications,
      recentActivity,
      pendingApprovalJobs,
    };

    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    console.error("Recruiter stats error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
