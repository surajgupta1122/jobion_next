"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

type RoleRow = { id: number; name: string };

export default function AdminJobRolesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/job-roles");
      if (!data?.ok) throw new Error(data?.message || "Failed to load roles");
      setRows(data.roles || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load roles");
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Job Roles</h1>
          <p className="text-sm text-gray-500">Total {loading ? "-" : rows.length} job roles</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
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
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">Roles</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold hover:bg-gray-50">
              Add New Role
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">ID</th>
                <th className="text-left font-semibold px-4 py-3">Role Name</th>
                <th className="text-left font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <SkeletonRows cols={3} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold hover:bg-gray-50">
                          Edit
                        </button>
                        <button className="px-3 py-1.5 rounded-md border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50">
                          Delete
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

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
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

