import Home from "./modules/guest/home/page";
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
  const canonical = baseUrl ? `${baseUrl}/` : "/";

  const title = "Jobion - Find Jobs & Hire Talent";
  const description =
    "Search jobs, apply easily, and connect with recruiters. Jobion helps candidates find work and companies hire faster.";

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
  <Home />
  </div>
);
}