import type { Metadata } from "next";
import db from "@/app/lib/db";
import JobDetails from "@/app/modules/guest/jobs/JobDetails";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

type JobRow = Record<string, any>;

function toNumberOrNull(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function getBaseUrl() {
  // Prefer explicit env for consistent canonical URLs (recommended in production)
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (explicit) return explicit.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (!host) return "";
  return `${proto}://${host}`.replace(/\/$/, "");
}

async function getJobOrNull(idOrUnderscoreId: string) {
  // Try both 'id' and '_id' for compatibility
  let [rows]: any = await db.query(
    `
    SELECT j.*, r.name AS roleName
    FROM jobs j
    LEFT JOIN job_roles r ON j.role_id = r.id
    WHERE j.id = ?
  `,
    [idOrUnderscoreId],
  );

  let idColumn: "id" | "_id" = "id";
  if (!rows?.length) {
    try {
      [rows] = await db.query(
        `
        SELECT j.*, r.name AS roleName
        FROM jobs j
        LEFT JOIN job_roles r ON j.role_id = r.id
        WHERE j._id = ?
      `,
        [idOrUnderscoreId],
      );
      idColumn = "_id";
    } catch {
      // Some schemas don't have `_id`; treat as not found.
      rows = [];
    }
  }

  const jobData: JobRow | undefined = rows?.[0];
  if (!jobData) return null;

  // Option A: treat expired jobs as removed (404 for crawlers/users)
  if (jobData.expires_at) {
    const exp = new Date(jobData.expires_at);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() <= Date.now()) {
      return null;
    }
  }

  const [tagRows]: any = await db.query(
    `
    SELECT jt.name
    FROM job_tag_map jtm
    JOIN job_tags jt ON jt.id = jtm.tag_id
    WHERE jtm.job_id = ?
  `,
    [jobData[idColumn]],
  );

  const skills = (tagRows || []).map((t: any) => t.name).filter(Boolean);

  const job = {
    id: jobData.id ?? jobData._id,
    title: jobData.roleName || jobData.title || "Job",
    company: jobData.company || "",
    description: jobData.description || "",
    type: jobData.job_type || "",
    workMode: jobData.work_mode || "",
    city: jobData.city || null,
    state: jobData.state || null,
    country: jobData.country || "India",
    locality: jobData.locality || null,
    minSalary: toNumberOrNull(jobData.min_salary),
    maxSalary: toNumberOrNull(jobData.max_salary),
    min_experience: toNumberOrNull(jobData.min_experience),
    max_experience: toNumberOrNull(jobData.max_experience),
    vacancies: toNumberOrNull(jobData.vacancies),
    tags: skills,
    logoPath: jobData.logo_path || null,
    recruiterId: jobData.recruiter_id ?? null,
    interviewAddress: jobData.interview_address || null,
    showInterviewAddress: jobData.show_interview_address !== false,
    contactEmail: jobData.contact_email || null,
    contactPhone: jobData.contact_phone || null,
    showContactPhone: jobData.show_contact_phone !== false,
    status: jobData.status || null,
    posted_at: jobData.posted_at || jobData.created_at || null,
    expires_at: jobData.expires_at || null,
  };

  return { job, raw: jobData };
}

function buildJobPostingJsonLd(args: {
  baseUrl: string;
  job: any;
}) {
  const { baseUrl, job } = args;

  const jobUrl = baseUrl ? `${baseUrl}/jobs/${job.id}` : `/jobs/${job.id}`;
  const title = String(job.title || "Job");
  const descriptionText = String(job.description || "").trim();

  // If you store HTML in DB, keep it; otherwise this is plain text.
  const description = descriptionText || `Apply for ${title} at ${job.company}`;

  const validThrough = job.expires_at ? new Date(job.expires_at).toISOString() : undefined;
  const datePosted = job.posted_at ? new Date(job.posted_at).toISOString() : undefined;

  const streetAddress = job.interviewAddress || job.locality || undefined;

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: "Jobion",
      value: String(job.id),
    },
    hiringOrganization: {
      "@type": "Organization",
      name: String(job.company || "Company"),
    },
    employmentType: job.type ? String(job.type) : undefined,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress,
        addressLocality: job.city || undefined,
        addressRegion: job.state || undefined,
        addressCountry: job.country || undefined,
      },
    },
    datePosted,
    validThrough,
    directApply: true,
    url: jobUrl,
  };

  if (job.minSalary != null || job.maxSalary != null) {
    const min = job.minSalary ?? job.maxSalary;
    const max = job.maxSalary ?? job.minSalary;
    if (min != null && max != null) {
      jsonLd.baseSalary = {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: Number(min),
          maxValue: Number(max),
          unitText: "MONTH",
        },
      };
    }
  }

  // Remove undefined fields for cleaner JSON-LD
  return JSON.parse(JSON.stringify(jsonLd));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = await getBaseUrl();
  const res = await getJobOrNull(id);
  if (!res) {
    return {
      title: "Job not found | Jobion",
      robots: { index: false, follow: false },
    };
  }

  const { job } = res;
  const title = `${job.title} - ${job.company} | Jobion`;
  const description =
    (job.description && String(job.description).slice(0, 160)) ||
    `Apply for ${job.title} at ${job.company}`;
  const canonical = baseUrl ? `${baseUrl}/jobs/${job.id}` : `/jobs/${job.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${job.title} - ${job.company}`,
      description,
      url: canonical,
      siteName: "Jobion",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} - ${job.company}`,
      description,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = await getBaseUrl();
  const res = await getJobOrNull(id);

  if (!res) {
    notFound();
  }

  const { job } = res;
  const jobPostingJsonLd = buildJobPostingJsonLd({ baseUrl, job });

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />
      <JobDetails initialJob={job} />
    </>
  );
}
