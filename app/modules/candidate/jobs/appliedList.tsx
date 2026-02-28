"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
} from "lucide-react";
import api from "../../../components/apiconfig/apiconfig";

// Types
interface Application {
  id: string | number;
  job_id: string | number;
  title: string;
  company: string;
  status: "applied" | "shortlisted" | "rejected" | string;
  city?: string | null;
  locality?: string | null;
  job_type?: string;
  salary?: string | null;
  applied_at: string;
}

interface ApiResponse {
  ok: boolean;
  applications?: Application[];
  error?: string;
  message?: string;
}

const statusColors: Record<string, string> = {
  applied: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
  shortlisted: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
};

const statusLabels: Record<string, string> = {
  applied: "Applied",
  shortlisted:
    "Your application has been shortlisted. The recruiter may contact you.",
  rejected: "Your application was not selected for this role.",
};

export default function Applied() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppliedJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse>("/jobs/applied-jobs");

      if (response.data.ok) {
        setApplications(response.data.applications || []);
      } else {
        throw new Error(response.data.error || "Failed to load applications");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message ||
          "Failed to load applications",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLocation = (application: Application): string => {
    if (application.city && application.locality) {
      return `${application.city}, ${application.locality}`;
    }
    return application.city || application.locality || "Location not specified";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Applications
            </h3>
            <p className="text-primary-600 mb-6 text-sm">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchAppliedJobs}
                className="btn btn-primary px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/jobs")}
                className="btn btn-ghost px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Applied Jobs
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track your job applications
            </p>
          </div>
          <div className="px-3 py-1.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded-lg text-sm font-medium">
            {applications.length} Applied
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start your job search journey! Apply to positions that match
                your skills.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => (window.location.href = "/jobs")}
                  className="btn btn-primary px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Jobs
                </button>
                <button
                  onClick={() => (window.location.href = "/dashboard/profile")}
                  className="btn btn-ghost px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-text-dark mb-1">
                            {application.title}
                          </h3>
                          <p className="text-base font-semibold text-gray-700 mb-2">
                            {application.company}
                          </p>
                          <Link
                            href={`/jobs/${application.job_id}`}
                            className="inline-flex items-center gap-1 text-sm text-[#AD1717] hover:text-[#991B1B] font-medium transition-colors"
                          >
                            <ExternalLink size={14} />
                            View Applied Job
                          </Link>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${statusColors[application.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                        >
                          {statusLabels[application.status] ||
                            application.status}
                        </span>
                      </div>

                      {/* Job Details */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {application.job_type && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FEF2F2] text-[#991B1B] rounded-lg text-sm border border-[#FECACA]">
                            <Briefcase size={14} />
                            {application.job_type}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200">
                          <MapPin size={14} />
                          {getLocation(application)}
                        </span>
                        {application.salary && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200">
                            💰 {application.salary}
                          </span>
                        )}
                      </div>

                      {/* Applied Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>
                          Applied on {formatDate(application.applied_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
