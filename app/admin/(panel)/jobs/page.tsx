"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

type JobRow = {
  id: number;
  title?: string;
  company?: string;
  recruiter_email?: string;
  city?: string;
  status?: string;
  created_at?: string;
  posted_at?: string;
  expires_at?: string;
  job_type?: string;
  min_experience?: number;
  max_experience?: number;
  min_salary?: number;
  max_salary?: number;
};

export default function AdminJobsPage() {
  const [tab, setTab] = useState<"all" | "approved" | "pending" | "rejected" | "closed">("all");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<number | null>(null);

  const load = async (t = tab) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/admin/jobs?status=${t}`);
      if (!data?.ok) throw new Error(data?.message || "Failed to load jobs");
      setRows(data.jobs || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const canRenew = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const exp = new Date(expiresAt).getTime();
    if (!Number.isFinite(exp)) return false;
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return now >= exp - sevenDaysMs;
  };

  const renew = async (jobId: number) => {
    try {
      setRenewingId(jobId);
      const { data } = await api.patch(`/jobs/${jobId}/renew`);
      if (!data?.ok) throw new Error(data?.message || "Failed to renew job");
      await load(tab);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Failed to renew job");
    } finally {
      setRenewingId((prev) => (prev === jobId ? null : prev));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-sm text-gray-500">
            {tab === "all" ? "All jobs" : `${tab} jobs`} · Total {loading ? "-" : rows.length}
          </p>
        </div>
        <button
          onClick={() => load(tab)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>All Jobs</TabButton>
        <TabButton active={tab === "approved"} onClick={() => setTab("approved")}>Approved</TabButton>
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>Pending</TabButton>
        <TabButton active={tab === "rejected"} onClick={() => setTab("rejected")}>Rejected</TabButton>
        <TabButton active={tab === "closed"} onClick={() => setTab("closed")}>Closed</TabButton>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Job Details</th>
                <th className="text-left font-semibold px-4 py-3">Company & Recruiter</th>
                <th className="text-left font-semibold px-4 py-3">Location</th>
                <th className="text-left font-semibold px-4 py-3">Posted</th>
                <th className="text-left font-semibold px-4 py-3">Expires</th>
                <th className="text-left font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <SkeletonRows cols={6} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                rows.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 truncate max-w-[280px]">
                        {j.title || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {j.job_type ? `${j.job_type}` : ""}{" "}
                        {j.min_experience != null && j.max_experience != null
                          ? `· ${j.min_experience}-${j.max_experience} Yrs`
                          : ""}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Status: {j.status || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{j.company || "—"}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[260px]">
                        {j.recruiter_email || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{j.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(j.posted_at || j.created_at) ? new Date((j.posted_at || j.created_at) as string).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {j.expires_at ? new Date(j.expires_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold hover:bg-gray-50">
                          View Details
                        </button>
                        <button
                          disabled={!canRenew(j.expires_at) || renewingId === j.id}
                          onClick={() => renew(j.id)}
                          className={`px-3 py-1.5 rounded-md border text-xs font-semibold ${
                            !canRenew(j.expires_at) || renewingId === j.id
                              ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={
                            canRenew(j.expires_at)
                              ? "Renew this job (extends expiry by 30 days)"
                              : "Renewal allowed only within 7 days of expiry"
                          }
                        >
                          {renewingId === j.id ? "Renewing…" : "Renew"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
        active
          ? "bg-primary-600 text-white border-primary-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full max-w-[260px] bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

