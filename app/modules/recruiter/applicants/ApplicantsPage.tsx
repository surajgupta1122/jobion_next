"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/app/components/apiconfig/apiconfig.jsx";
import { useToast } from "@/app/components/toast";
import { CheckCircle2, FileText, XCircle, Filter } from "lucide-react";

type ApplicantRow = {
  application_id: number;
  job_id: number;
  user_id: number;
  status: "applied" | "shortlisted" | "rejected";
  applied_at?: string | null;
  cover_letter?: string | null;
  resume_path?: string | null;
  candidate: {
    name: string;
    email: string;
    phone?: string;
    date_of_birth?: string | null;
    location?: string;
    availability?: string | null;
    experience_years?: number | string | null;
    highest_qualification?: string | null;
    trade_stream?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
  };
};

type ApiResp = {
  ok: boolean;
  message?: string;
  job?: { id: number; company?: string; city?: string; state?: string; status?: string };
  applicants?: ApplicantRow[];
};

function normPhone(raw?: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  // Keep last 10 for Indian numbers; still works for others as a best-effort
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function statusPill(status: ApplicantRow["status"]) {
  const s = status.toLowerCase();
  if (s === "shortlisted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function calcAge(dob?: string | null) {
  if (!dob) return "";
  const d = new Date(dob);
  if (!Number.isFinite(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age > 0 && age < 120 ? String(age) : "";
}

export default function ApplicantsPage({ jobId }: { jobId: string }) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<ApiResp["job"] | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ApplicantRow["status"]>("all");
  const [updating, setUpdating] = useState<Record<number, boolean>>({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const { data } = await api.get<ApiResp>(`/recruiter/jobs/${jobId}/applicants${qs}`);
      if (!data?.ok) throw new Error(data?.message || "Failed to load applicants");
      setJob(data.job || null);
      setApplicants(data.applicants || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load applicants");
      setApplicants([]);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, jobId]);

  const counts = useMemo(() => {
    const c = { all: applicants.length, applied: 0, shortlisted: 0, rejected: 0 } as any;
    for (const a of applicants) c[a.status] = (c[a.status] || 0) + 1;
    return c as { all: number; applied: number; shortlisted: number; rejected: number };
  }, [applicants]);

  const updateStatus = async (applicationId: number, status: "shortlisted" | "rejected") => {
    const ok = window.confirm(
      status === "shortlisted" ? "Shortlist this candidate?" : "Reject this candidate?",
    );
    if (!ok) return;

    setUpdating((s) => ({ ...s, [applicationId]: true }));
    try {
      const { data } = await api.patch<{ ok: boolean; message?: string; status?: string }>(
        `/recruiter/applications/${applicationId}/status`,
        { status },
      );
      if (!data?.ok) throw new Error(data?.message || "Failed to update status");
      showSuccess(status === "shortlisted" ? "Candidate shortlisted" : "Candidate rejected");
      await load();
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || "Failed to update status");
    } finally {
      setUpdating((s) => ({ ...s, [applicationId]: false }));
    }
  };

  const openResume = (resumePath?: string | null) => {
    if (!resumePath) return;
    // best-effort: treat as server file path if not absolute
    let url = resumePath;
    if (!url.startsWith("http")) {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";
      let serverBase = apiBase;
      if (apiBase.endsWith("/api")) serverBase = apiBase.slice(0, -4);
      else if (apiBase.includes("/api/")) serverBase = apiBase.split("/api")[0];
      serverBase = serverBase.replace(/\/$/, "");
      const p = url.startsWith("/") ? url : `/${url}`;
      url = `${serverBase}${p}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Job #{jobId}
            </span>
          </div>
          {job && (
            <p className="text-sm text-slate-600 mt-1">
              {job.company ? <span className="font-semibold text-slate-800">{job.company}</span> : null}
              {(job.city || job.state) ? (
                <span className="text-slate-500">
                  {" "}
                  · {[job.city, job.state].filter(Boolean).join(", ")}
                </span>
              ) : null}
            </p>
          )}
          <div className="mt-3">
            <Link href="/job-posted" className="text-sm font-semibold text-red-700 hover:underline">
              ← Back to My Jobs
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 px-3 py-2 rounded-full bg-white border border-slate-200">
            <Filter size={14} /> Filter
          </span>
          <button
            className={`px-4 py-2 rounded-full text-sm font-bold border ${filter === "all" ? "bg-red-700 text-white border-red-700" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-bold border ${filter === "applied" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            onClick={() => setFilter("applied")}
          >
            Applied
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-bold border ${filter === "shortlisted" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            onClick={() => setFilter("shortlisted")}
          >
            Shortlisted
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-bold border ${filter === "rejected" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
          <div className="mt-3 h-4 w-72 bg-slate-100 rounded animate-pulse" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : applicants.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="text-lg font-bold text-slate-900">No applicants yet</div>
          <div className="text-sm text-slate-600 mt-1">
            When candidates apply, they’ll appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((a) => {
            const linkedIn = String(a.candidate.linkedin_url || "").trim();
            const github = String(a.candidate.github_url || "").trim();
            return (
              <div key={a.application_id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-lg font-bold text-slate-900 truncate">
                        {a.candidate.name}
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-semibold ${statusPill(a.status)}`}>
                        {a.status.toUpperCase()}
                      </span>
                      {a.applied_at && (
                        <span className="text-xs font-semibold text-slate-500">
                          Applied {new Date(a.applied_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">Phone:</span>{" "}
                        <span className="break-words">{a.candidate.phone || "—"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">Age:</span>{" "}
                        <span>{calcAge(a.candidate.date_of_birth) || "—"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">Location:</span>{" "}
                        <span className="break-words">{a.candidate.location || "—"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">Availability:</span>{" "}
                        <span className="break-words">{a.candidate.availability || "—"}</span>
                      </div>
                      <div className="min-w-0 sm:col-span-2">
                        <span className="font-semibold text-slate-700">Email:</span>{" "}
                        {a.candidate.email ? (
                          <a className="hover:underline break-words" href={`mailto:${a.candidate.email}`}>
                            {a.candidate.email}
                          </a>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">Education:</span>{" "}
                        <span className="break-words">
                          {[a.candidate.highest_qualification, a.candidate.trade_stream]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">Experience:</span>{" "}
                        <span>
                          {a.candidate.experience_years !== null &&
                            a.candidate.experience_years !== undefined &&
                            String(a.candidate.experience_years).trim() !== ""
                            ? `${String(a.candidate.experience_years)} year(s)`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {a.cover_letter && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                          Cover Letter
                        </div>
                        <div className="whitespace-pre-wrap">{a.cover_letter}</div>
                      </div>
                    )}

                    <div className="mt-4">
                      {a.status === "applied" ? (
                        <div className="flex flex-wrap gap-2 justify-start">
                          <button
                            type="button"
                            onClick={() => updateStatus(a.application_id, "shortlisted")}
                            disabled={!!updating[a.application_id]}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={16} />
                            Shortlist
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(a.application_id, "rejected")}
                            disabled={!!updating[a.application_id]}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">
                          Status locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openResume(a.resume_path)}
                        disabled={!a.resume_path}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText size={16} />
                        Resume
                      </button>
                      {linkedIn && (
                        <a
                          href={linkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                        >
                          LinkedIn
                        </a>
                      )}
                      {github && (
                        <a
                          href={github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                        >
                          GitHub
                        </a>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && applicants.length > 0 && (
        <div className="text-xs text-slate-500">
          Showing <b className="text-slate-700">{counts.all}</b> applicants.
        </div>
      )}
    </div>
  );
}

