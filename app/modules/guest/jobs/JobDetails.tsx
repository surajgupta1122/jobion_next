"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/components/apiconfig/apiconfig";

import {
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";

// ---------------- TYPES ----------------
type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  workMode?: string;
  type?: string;
  min_salary?: number;
  max_salary?: number;
  min_experience?: number;
  max_experience?: number;
  vacancies?: number;
  description?: string;
};

// ---------------- COMPONENT ----------------
export default function JobDetails({ id }: { id: string }) {
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // ---------------- FETCH JOB ----------------
  useEffect(() => {
    fetchJob();
    checkSaved();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/jobs/${id}`);

      if (data?.ok && data.job) {
        setJob(data.job);
      }
    } catch (err) {
      console.log("Error fetching job", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE STATUS ----------------
  const checkSaved = async () => {
    try {
      const res = await api.get(`/jobs/save/${id}`);
      setIsSaved(res.data.isSaved);
    } catch {
      setIsSaved(false);
    }
  };

  // ---------------- TOGGLE SAVE ----------------
  const toggleSave = async () => {
    try {
      if (isSaved) {
        await api.delete(`/jobs/save/${id}`);
        setIsSaved(false);
      } else {
        await api.post(`/jobs/save/${id}`);
        setIsSaved(true);
      }
    } catch (err) {
      console.log("Save error", err);
    }
  };

  // ---------------- HELPERS ----------------
  const formatSalary = () => {
    if (!job) return "";

    if (job.min_salary && job.max_salary) {
      return `₹ ${job.min_salary.toLocaleString(
        "en-IN"
      )} - ${job.max_salary.toLocaleString("en-IN")}`;
    }

    if (job.min_salary) return `₹ ${job.min_salary}+`;
    if (job.max_salary) return `Up to ₹ ${job.max_salary}`;

    return "";
  };

  const formatExperience = () => {
    if (!job) return "";

    if (job.min_experience != null && job.max_experience != null) {
      return `${job.min_experience}-${job.max_experience} yrs`;
    }

    return "";
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return <div className="p-6 text-gray-600">Loading job...</div>;
  }

  if (!job) {
    return <div className="p-6 text-red-500">Job not found</div>;
  }

  // ---------------- UI ----------------
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-gray-600 mt-1">{job.company}</p>

            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {job.location}
                </span>
              )}

              {job.type && (
                <span className="flex items-center gap-1">
                  <Briefcase size={14} /> {job.type}
                </span>
              )}

              {job.workMode && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {job.workMode}
                </span>
              )}

              {formatExperience() && (
                <span className="flex items-center gap-1">
                  <GraduationCap size={14} /> {formatExperience()}
                </span>
              )}
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button onClick={toggleSave}>
            {isSaved ? (
              <BookmarkCheck className="text-red-600" />
            ) : (
              <Bookmark />
            )}
          </button>
        </div>

        {/* SALARY */}
        {formatSalary() && (
          <p className="mt-4 text-lg font-semibold text-red-600">
            {formatSalary()} /Month
          </p>
        )}

        {/* VACANCIES */}
        {job.vacancies && (
          <p className="text-sm text-gray-500 mt-1">
            {job.vacancies} vacancies
          </p>
        )}
      </div>

      {/* DESCRIPTION */}
      {job.description && (
        <div className="bg-white rounded-xl border p-6 mt-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {job.description}
          </p>
        </div>
      )}

      {/* APPLY BUTTON */}
      <div className="mt-6">
        <button
          onClick={() => router.push("/sign-in")}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}