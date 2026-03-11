"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

type Recruiter = {
  id: number;
  company_name?: string;
  company_type?: string;
  website?: string;
  hr_name?: string;
  hr_mobile?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
};

export default function PendingRecruitersPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Recruiter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/recruiters?status=pending");
      if (!data?.ok) throw new Error(data?.message || "Failed to load recruiters");
      setRows(data.recruiters || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load recruiters");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <Header
        title="Pending Recruiters"
        subtitle={`Total ${rows.length} recruiters waiting for verification`}
        onRefresh={load}
      />

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-blue-600 text-white">
          <div className="font-semibold">Pending Verification ({loading ? "-" : rows.length})</div>
          <div className="text-xs opacity-90">Recruiters waiting for verification approval</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Company</th>
                <th className="text-left font-semibold px-4 py-3">Contact & HR</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">Location</th>
                <th className="text-left font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <SkeletonRows cols={5} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No pending recruiters
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {r.company_name || "—"}
                      </div>
                      {r.website && (
                        <div className="text-xs text-blue-600">{r.website}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{r.email || "—"}</div>
                      <div className="text-xs text-gray-500">
                        HR: {r.hr_name || "—"} {r.hr_mobile ? `· ${r.hr_mobile}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.company_type || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {[r.city, r.state, r.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold hover:bg-gray-50">
                          View
                        </button>
                        <button className="px-3 py-1.5 rounded-md border border-green-200 text-xs font-semibold text-green-700 hover:bg-green-50">
                          Verify
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

function Header({
  title,
  subtitle,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <button
        onClick={onRefresh}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
      >
        Refresh
      </button>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full max-w-[220px] bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

