"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Trash2,
  Eye,
  Clock,
} from "lucide-react";
import { useToast } from "../../../components/toast";
import api from "../../../components/apiconfig/apiconfig";

// Types
interface SavedJob {
  job_id: string | number;
  id: string | number;
  title: string;
  company: string;
  type?: string;
  location?: string;
  experience?: string | null;
  salary?: string | null;
  logo_path?: string | null;
  saved_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: SavedJob[];
  message?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function Saved() {
  const { showSuccess, showError } = useToast();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchSavedJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<ApiResponse>("/jobs/saved-jobs");

      if (response.data.success) {
        setSavedJobs(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch saved jobs");
      }
    } catch (err: unknown) {
      console.error("Error fetching saved jobs:", err);
      const apiError = err as ApiError;
      if (apiError.response?.data?.message) {
        setError(apiError.response.data.message);
      } else if (apiError.message) {
        setError(apiError.message);
      } else {
        setError("Error fetching saved jobs. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = async (jobId: string | number): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse>(`/jobs/save/${jobId}`);

      if (response.data.success) {
        setSavedJobs((prev) => prev.filter((job) => job.job_id !== jobId));
        showSuccess("Job removed from saved list");
      } else {
        showError(response.data.message || "Failed to remove job");
      }
    } catch (err: unknown) {
      console.error("Error removing job:", err);
      const apiError = err as ApiError;
      showError(apiError.message || "Error removing job. Please try again.");
    }
  };

  const handleViewJob = (jobId: string | number): void => {
    router.push(`/jobs/${jobId}`);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

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
              Unable to Load Saved Jobs
            </h3>
            <p className="text-primary-600 mb-6 text-sm">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchSavedJobs}
                className="btn btn-primary px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/jobs")}
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
            <h1 className="text-2xl font-semibold text-gray-900">Saved Jobs</h1>
            <p className="text-sm text-gray-600 mt-1">
              Your favorite job opportunities
            </p>
          </div>
          <div className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium">
            {savedJobs.length} Saved
          </div>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Saved Jobs Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start building your job collection! Save positions that interest
                you to review and apply later.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push("/jobs")}
                  className="btn btn-primary px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Jobs
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn btn-ghost px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div
                key={job.job_id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Job Logo/Icon */}
                    {job.logo_path ? (
                      <img
                        src={job.logo_path}
                        alt={job.company}
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <Star size={28} className="text-amber-600" />
                      </div>
                    )}

                    {/* Job Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-text-dark mb-1">
                            {job.title}
                          </h3>
                          <p className="text-base font-semibold text-gray-700">
                            {job.company}
                          </p>
                        </div>
                        <span className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 self-start">
                          <Star size={14} />
                          Saved
                        </span>
                      </div>

                      {/* Job Info */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.type && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                            <Briefcase size={14} />
                            {job.type}
                          </span>
                        )}
                        {job.location && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200">
                            <MapPin size={14} />
                            {job.location}
                          </span>
                        )}
                        {job.experience && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-200">
                            <GraduationCap size={14} />
                            {job.experience}
                          </span>
                        )}
                        {job.salary && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200">
                            💰 {job.salary}
                          </span>
                        )}
                      </div>

                      {/* Saved Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>Saved on {formatDate(job.saved_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 lg:flex-col">
                      <button
                        onClick={() => handleViewJob(job.id)}
                        className="btn btn-primary px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5 flex-1 lg:flex-none justify-center"
                      >
                        <Eye size={16} />
                        View Job
                      </button>
                      <button
                        onClick={() => removeSavedJob(job.job_id)}
                        className="btn btn-ghost px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1.5 flex-1 lg:flex-none justify-center"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
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
