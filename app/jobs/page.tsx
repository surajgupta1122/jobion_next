import JobList from "../modules/guest/jobs/JobList";
import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";

async function getBaseUrl() {
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

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const canonical = baseUrl ? `${baseUrl}/jobs` : "/jobs";

  const title = "Jobs - Browse Latest Openings";
  const description =
    "Browse the latest job openings by role and location. Save jobs, apply online, and track your applications on Jobion.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Jobion",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Page() {
  return (
    <div>
      <Suspense fallback={<div className="p-6 text-gray-600">Loading jobs…</div>}>
        <JobList />
      </Suspense>
    </div>
  );
}
