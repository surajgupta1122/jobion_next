export const runtime = "nodejs";

import db from "@/app/lib/db";

function baseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (explicit || "http://localhost:3000").replace(/\/$/, "");
}

function xmlEscape(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: unknown) {
  // Prevent closing the CDATA section inside content
  return `<![CDATA[${String(s ?? "").replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function formatRfc822(dt: any) {
  const d = dt ? new Date(dt) : new Date();
  return d.toUTCString();
}

export async function GET() {
  const siteUrl = baseUrl();

  // Indeed accepts a <source> feed with repeated <job> entries.
  const [rows]: any = await db.query(
    `
    SELECT
      j.id,
      r.name AS title,
      j.company,
      j.city,
      j.state,
      j.country,
      j.locality,
      j.description,
      j.job_type,
      j.min_salary,
      j.max_salary,
      j.created_at,
      j.posted_at,
      j.expires_at
    FROM jobs j
    LEFT JOIN job_roles r ON r.id = j.role_id
    WHERE j.status = 'approved'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
    ORDER BY COALESCE(j.posted_at, j.created_at) DESC
    LIMIT 20000
  `,
  );

  const publisherName = "Jobion";
  const publisherUrl = siteUrl || "https://jobion.in";

  const jobsXml = (rows || [])
    .map((j: any) => {
      const url = `${siteUrl}/jobs/${j.id}`;
      const salary =
        j.min_salary != null || j.max_salary != null
          ? [j.min_salary, j.max_salary].filter((v: any) => v != null).join(" - ")
          : "";

      const description =
        (j.description && String(j.description).trim()) ||
        `Apply for ${j.title || "Job"} at ${j.company || "Company"}.`;

      return `
  <job>
    <title>${xmlEscape(j.title || "Job")}</title>
    <date>${xmlEscape(formatRfc822(j.posted_at || j.created_at))}</date>
    <referencenumber>${xmlEscape(j.id)}</referencenumber>
    <url>${xmlEscape(url)}</url>
    <company>${xmlEscape(j.company || "")}</company>
    <city>${xmlEscape(j.city || "")}</city>
    <state>${xmlEscape(j.state || "")}</state>
    <country>${xmlEscape(j.country || "India")}</country>
    <description>${cdata(description)}</description>
    ${salary ? `<salary>${xmlEscape(salary)}</salary>` : ""}
    ${j.job_type ? `<jobtype>${xmlEscape(j.job_type)}</jobtype>` : ""}
  </job>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${xmlEscape(publisherName)}</publisher>
  <publisherurl>${xmlEscape(publisherUrl)}</publisherurl>
  <lastBuildDate>${xmlEscape(new Date().toUTCString())}</lastBuildDate>
  ${jobsXml}
</source>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

