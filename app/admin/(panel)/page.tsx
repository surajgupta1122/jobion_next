"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

type Stats = {
  totalUsers: number;
  totalJobs: number;
  recruiters: number;
  verifiedRecruiters: number;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/stats");
      if (!data?.ok) throw new Error(data?.message || "Failed to load stats");
      setStats(data.stats);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform overview</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers} loading={loading} />
        <StatCard title="Total Jobs" value={stats?.totalJobs} loading={loading} />
        <StatCard title="Recruiters" value={stats?.recruiters} loading={loading} />
        <StatCard title="Verified Recruiters" value={stats?.verifiedRecruiters} loading={loading} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {loading ? "-" : value ?? 0}
      </p>
      <p className="mt-1 text-xs text-gray-400">Click sidebar to view</p>
    </div>
  );
}

