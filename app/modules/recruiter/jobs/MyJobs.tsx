"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/app/components/apiconfig/apiconfig.jsx";
import { MoreVertical, Users, Plus, Clock, MapPin } from "lucide-react";

type JobRow = {
  id: number;
  title: string;
  company: string;
  city?: string | null;
  job_type?: string | null;
  work_mode?: string | null;
  vacancies?: number | null;
  status?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  totalApplications: number;
};

type ApiResponse = {
  ok: boolean;
  jobs: JobRow[];
};

export default function MyJobs() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openMenuJobId, setOpenMenuJobId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ApiResponse>("/recruiter/jobs");
      if (!data?.ok) throw new Error("Failed to load jobs");
      setJobs(data.jobs || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handler = () => setOpenMenuJobId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    return jobs
      .filter((j) => j.expires_at)
      .map((j) => ({ job: j, ts: new Date(j.expires_at as string).getTime() }))
      .filter((x) => Number.isFinite(x.ts) && x.ts >= now && x.ts <= in7Days)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, 1);
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-sm text-slate-500 font-medium">
            {loading ? "Loading…" : `${jobs.length} jobs posted`}
          </p>
        </div>

        <Link
          href="/create-job"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          <Plus size={16} />
          Post New Job
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-700">
              <Clock size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900">
                Jobs Expiring Soon
              </div>
              <div className="text-xs text-amber-800/80 mt-0.5">
                The following jobs will expire within 7 days:
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {expiringSoon[0].job.title}
              </div>
              <div className="text-xs text-amber-800/80 mt-0.5">
                Consider extending these jobs to keep them active.
              </div>
            </div>
            <div className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-full px-3 py-1">
              {daysLeftLabel(expiringSoon[0].job.expires_at)}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <JobSkeletonList />
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            No jobs posted yet.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {job.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 font-medium truncate">
                    {job.company}
                    {job.city ? ` · ${job.city}` : ""}
                    {job.job_type ? ` · ${pretty(job.job_type)}` : ""}
                    {job.work_mode ? ` · ${pretty(job.work_mode)}` : ""}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <StatusPill status={job.status} />
                    <span className="font-medium">
                      {job.created_at ? `Posted ${timeAgo(job.created_at)}` : ""}
                    </span>
                    {job.vacancies != null && (
                      <span className="font-medium">{job.vacancies} openings</span>
                    )}
                    <span className="font-medium">
                      {job.totalApplications} applicants
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/recruiter/jobs/${job.id}/applicants`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                  >
                    <Users size={16} />
                    Applicants ({job.totalApplications})
                  </Link>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuJobId((prev) => (prev === job.id ? null : job.id));
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                      aria-label="More"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuJobId === job.id && (
                      <div
                        className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/jobs/${job.id}`}
                          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          View Job
                        </Link>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            // TODO: wire close job API
                            setOpenMenuJobId(null);
                          }}
                        >
                          Close Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  const s = (status || "").toLowerCase();
  const cfg =
    s === "approved" || s === "live"
      ? { label: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : s === "rejected"
        ? { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" }
        : s === "pending"
          ? { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" }
          : { label: status || "—", cls: "bg-slate-50 text-slate-700 border-slate-200" };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function JobSkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="mt-2 h-4 w-72 bg-slate-100 rounded animate-pulse" />
          <div className="mt-4 h-4 w-96 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function pretty(v: string) {
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function timeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function daysLeftLabel(expiresAt?: string | null) {
  if (!expiresAt) return "";
  const ts = new Date(expiresAt).getTime();
  if (!Number.isFinite(ts)) return "";
  const diffDays = Math.max(0, Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24)));
  return diffDays === 1 ? "1 day" : `${diffDays} days`;
}

