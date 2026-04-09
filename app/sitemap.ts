import type { MetadataRoute } from "next";
import db from "@/app/lib/db";

function getBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (explicit || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const [rows]: any = await db.query(
    `
    SELECT id, updated_at, created_at
    FROM jobs
    WHERE status IN ('approved','pending')
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY id DESC
    LIMIT 50000
  `,
  );

  const jobEntries: MetadataRoute.Sitemap = (rows || []).map((r: any) => ({
    url: `${baseUrl}/jobs/${r.id}`,
    lastModified: r.updated_at || r.created_at || new Date().toISOString(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...jobEntries,
  ];
}

