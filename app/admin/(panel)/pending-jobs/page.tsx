"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

export default function PendingJobsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/jobs?status=pending");
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
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Jobs</h1>
          <p className="text-sm text-gray-500">
            Total {loading ? "-" : rows.length} jobs waiting for approval
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-amber-700 text-white">
          <div className="font-semibold">Pending Approval ({loading ? "-" : rows.length})</div>
          <div className="text-xs opacity-90">Jobs waiting for admin approval</div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <div className="text-lg font-semibold text-gray-800">No Pending Jobs</div>
            <div className="text-sm text-gray-500">All jobs have been reviewed</div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-sm text-gray-600">
              View them in <a className="text-blue-600 underline" href="/admin/jobs">Jobs</a> → Pending tab.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

