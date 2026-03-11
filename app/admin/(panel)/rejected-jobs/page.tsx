"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

export default function RejectedJobsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/jobs?status=rejected");
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
          <h1 className="text-2xl font-bold text-gray-900">Rejected Jobs</h1>
          <p className="text-sm text-gray-500">
            Total {loading ? "-" : rows.length} rejected jobs
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
        <div className="px-4 py-3 bg-red-600 text-white">
          <div className="font-semibold">Rejected Jobs ({loading ? "-" : rows.length})</div>
          <div className="text-xs opacity-90">Jobs that have been rejected by admin</div>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-600">
            View them in <a className="text-blue-600 underline" href="/admin/jobs">Jobs</a> → Rejected tab.
          </div>
        </div>
      </div>
    </div>
  );
}

