"use client";
import {
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
  Mail,
  Phone,
  MapPinned,
  Users,
  Lock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "../../../components/toast/ToastContext";
import api from "../../../components/apiconfig/apiconfig";

// Types
interface Job {
  id: string | number;
  title?: string;
  role_name?: string;
  job_role?: string;
  roleId?: number;
  company: string;
  description?: string;
  type?: string;
  workMode?: string;
  location?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  locality?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  min_experience?: number | null;
  max_experience?: number | null;
  vacancies?: number | null;
  tags?: string[];
  logoPath?: string | null;
  recruiterId?: string | number;
  interviewAddress?: string | null;
  showInterviewAddress?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  showContactPhone?: boolean;
  [key: string]: any;
}

interface CandidateProfile {
  full_name?: string;
  resume_path?: string | null;
  [key: string]: any;
}

interface UserSession {
  user?: {
    email: string;
    role?: "candidate" | "recruiter" | "admin";
    id: string | number;
  };
}

interface JobPostingSchema {
  [key: string]: any;
}

type JobDetailsProps = {
  initialJob?: Job | null;
};

// Utility functions to mask contact information
const maskPhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••• ••••";
  const lastFour = digits.slice(-4);
  if (phone.startsWith("+")) {
    const countryCode = phone.match(/^\+\d{1,3}/)?.[0] || "+91";
    return `${countryCode} •••• ••${lastFour}`;
  }
  return `•••• ••${lastFour}`;
};

const maskEmail = (email?: string | null): string | null => {
  if (!email) return null;
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "••••••@••••••";
  const firstChar = localPart[0];
  return `${firstChar}••••••@${domain}`;
};

const maskAddress = (address?: string | null): string | null => {
  if (!address) return null;
  if (address.length <= 20) return "••••••••••••••••";
  return address.substring(0, 15) + "••••••••••";
};

// Helper function to view resume
const viewResume = (
  resumePath?: string | null,
  candidateName?: string,
): void => {
  if (resumePath) {
    let resumeUrl = resumePath;
    if (!resumeUrl.startsWith("http")) {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";
      let serverBase = apiBase;
      if (apiBase.endsWith("/api")) {
        serverBase = apiBase.slice(0, -4);
      } else if (apiBase.includes("/api/")) {
        serverBase = apiBase.split("/api")[0];
      }
      serverBase = serverBase.replace(/\/$/, "");
      const resumePathNormalized = resumeUrl.startsWith("/")
        ? resumeUrl
        : `/${resumeUrl}`;
      resumeUrl = `${serverBase}${resumePathNormalized}`;
    }
    window.open(resumeUrl, "_blank");
  }
};

// Helper function to format location
const formatLocation = (job: Job | null): string => {
  if (!job) return "";
  if (job.location) return job.location;
  
  const parts = [];
  if (job.locality) parts.push(job.locality);
  if (job.city) parts.push(job.city);
  if (job.state) parts.push(job.state);
  if (job.country && job.country !== "India") parts.push(job.country);
  
  return parts.length > 0 ? parts.join(", ") : "Location not specified";
};

// Helper function to get job title
const getJobTitle = (job: Job | null): string => {
  if (!job) return "Loading...";
  return job.title || job.role_name || job.job_role || "Untitled Position";
};

// Helper function to map job data
const mapJobData = (jobData: any): Job => {
  return {
    id: jobData.id || jobData._id,
    role_id: jobData.role_id,
    title: jobData.title || jobData.roleName || jobData.role_name || jobData.job_role || "Untitled Position",
    role_name: jobData.roleName || jobData.role_name,
    company: jobData.company || jobData.companyName || "",
    description: jobData.description || "",
    type: jobData.job_type || jobData.type || jobData.jobType || "",
    workMode: jobData.work_mode || jobData.workMode || jobData.mode || "Office",
    location: jobData.location || "",
    city: jobData.city || null,
    state: jobData.state || null,
    country: jobData.country || "India",
    locality: jobData.locality || null,
    minSalary: jobData.min_salary || jobData.minSalary,
    maxSalary: jobData.max_salary || jobData.maxSalary,
    min_experience: jobData.min_experience || jobData.minExperience,
    max_experience: jobData.max_experience || jobData.maxExperience,
    vacancies: jobData.vacancies,
    tags: jobData.skills || jobData.tags || [],
    logoPath: jobData.logo_path || jobData.logoPath,
    recruiterId: jobData.recruiter_id || jobData.recruiterId,
    interviewAddress: jobData.interview_address || jobData.interviewAddress,
    showInterviewAddress: jobData.show_interview_address !== false,
    contactEmail: jobData.contact_email || jobData.contactEmail,
    contactPhone: jobData.contact_phone || jobData.contactPhone,
    showContactPhone: jobData.show_contact_phone !== false,
    status: jobData.status,
    posted_at: jobData.posted_at,
    expires_at: jobData.expires_at,
  };
};

export default function JobDetail({ initialJob = null }: JobDetailsProps) {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [job, setJob] = useState<Job | null>(initialJob);
  const [jobPostingSchema, setJobPostingSchema] =
    useState<JobPostingSchema | null>(null);
  const [loading, setLoading] = useState(!initialJob);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [candidateProfile, setCandidateProfile] =
    useState<CandidateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // User role state
  const [userRole, setUserRole] = useState<
    "candidate" | "recruiter" | "admin" | null
  >(null);
  const [userId, setUserId] = useState<string | number | null>(null);

  // Application form state
  const [coverLetter, setCoverLetter] = useState("");
  const [updateResumeFile, setUpdateResumeFile] = useState<File | null>(null);

  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Determine user access level for contact info
  const getContactAccessLevel = (): "full" | "partial" | "masked" => {
    if (!isAuthenticated) return "masked";
    if (userRole === "admin" || userRole === "recruiter") return "full";
    if (userRole === "candidate" && isApplied) return "full";
    if (userRole === "candidate") return "partial";
    return "masked";
  };

  // Check if current user is the job poster
  const isOwnJob = (): boolean => {
    return (
      isAuthenticated && userRole === "recruiter" && job?.recruiterId === userId
    );
  };

  // Check if Apply/Save buttons should be hidden
  const shouldHideActionButtons = (): boolean => {
    return userRole === "recruiter" || userRole === "admin";
  };

  // Check if job is already applied
  const checkAppliedStatus = async (jobId: string): Promise<void> => {
    try {
      const response = await api.get("/jobs/applied-jobs");
      if (response.data?.ok && response.data.applications) {
        const applied = response.data.applications.some(
          (app: any) => app.job_id === Number(jobId),
        );
        setIsApplied(applied);
        if (applied) {
          setIsSaved(false);
        }
      }
    } catch (error) {
      console.error("Error checking applied status:", error);
      setIsApplied(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (initialJob) {
          // Already have the job from server render; still refresh save/applied state below.
          await checkSavedStatus(id);
          return;
        }

        setLoading(true);
        const { data } = await api.get(`/jobs/${id}`);
        if (!alive) return;
        if (data.ok && data.job) {
          console.log("Raw job data:", data.job);
          
          const mappedJob = mapJobData(data.job);
          setJob(mappedJob);
          setJobPostingSchema(data.jobPostingSchema);
          await checkSavedStatus(id);
        } else {
          setError(data.message || "Job not found");
        }
      } catch (err: any) {
        console.error("Failed to fetch job:", err);
        setError(
          err?.response?.data?.message || err.message || "Failed to load job",
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, initialJob]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/session");
        if (alive) {
          setIsAuthenticated(Boolean(data?.user));
          if (data?.user) {
            setUserEmail(data.user.email);
            setUserRole(data.user.role || "candidate");
            setUserId(data.user.id);

            if (data.user.role === "candidate" || !data.user.role) {
              await loadCandidateProfile();
              await checkAppliedStatus(id);
            }
          }
        }
      } catch (err) {
        if (alive) {
          setIsAuthenticated(false);
          setUserRole(null);
          setUserId(null);
        }
      } finally {
        if (alive) setAuthChecked(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const loadCandidateProfile = async (): Promise<void> => {
    setProfileLoading(true);
    try {
      const res = await api.get("/profile/user");
      if (res?.data?.success && res.data.user) {
        setCandidateProfile(res.data.user);
      }
    } catch (err) {
      setCandidateProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const isProfileComplete = (): boolean => {
    if (!candidateProfile) return false;
    return !!(candidateProfile.full_name && userEmail);
  };

  const checkSavedStatus = async (jobId: string): Promise<void> => {
    try {
      const response = await api.get(`/jobs/save/${jobId}`);
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error("Error checking saved status:", error);
      setIsSaved(false);
    }
  };

  const redirectToLoginForSave = (): void => {
    try {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem("postLoginSaveJobId", id);
      localStorage.setItem("postLoginRedirect", currentPath || `/jobs/${id}`);
    } catch (err) {
      // ignore storage failures
    }
    router.push("/sign-in");
  };

  const toggleSave = async (): Promise<void> => {
    if (shouldHideActionButtons()) {
      return;
    }

    if (!isAuthenticated) {
      if (!authChecked) {
        try {
          const { data } = await api.get("/auth/session");
          if (data?.user) {
            setIsAuthenticated(true);
            setUserRole(data.user.role || "candidate");
            setUserId(data.user.id);
          } else {
            redirectToLoginForSave();
            return;
          }
        } catch (err) {
          redirectToLoginForSave();
          return;
        }
      } else {
        redirectToLoginForSave();
        return;
      }
    }

    try {
      if (isSaved) {
        await api.delete(`/jobs/save/${id}`);
        setIsSaved(false);
      } else {
        await api.post(`/jobs/save/${id}`);
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error("Error toggling save:", error);
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage.includes("already applied")) {
        alert("Cannot save a job you have already applied to");
        setIsApplied(true);
      } else {
        alert("Error: " + errorMessage);
      }
    }
  };

  const skills = job?.tags || [];

  const formatSalaryMonthly = (): string | null => {
    if (!job) return null;

    const minSalary = job.minSalary;
    const maxSalary = job.maxSalary;

    if (minSalary != null && maxSalary != null) {
      return `₹ ${Number(minSalary).toLocaleString("en-IN")} - ${Number(maxSalary).toLocaleString("en-IN")} /Month`;
    } else if (minSalary != null) {
      return `₹ ${Number(minSalary).toLocaleString("en-IN")}+ /Month`;
    } else if (maxSalary != null) {
      return `Up to ₹ ${Number(maxSalary).toLocaleString("en-IN")} /Month`;
    }

    return null;
  };

  const formatExperience = (): string | null => {
    if (!job) return null;
    const minExp = job.min_experience;
    const maxExp = job.max_experience;

    if (minExp == null && maxExp == null) return null;
    if (minExp === 0 && (maxExp === 0 || maxExp === 1)) return "Fresher";
    if (minExp != null && maxExp != null) return `${minExp} - ${maxExp} yrs`;
    if (minExp != null) return `${minExp}+ yrs`;
    if (maxExp != null) return `Up to ${maxExp} yrs`;
    return null;
  };

  const redirectToLoginForApply = (): void => {
    try {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem("postLoginApplyJobId", id);
      localStorage.setItem("postLoginRedirect", currentPath || `/jobs/${id}`);
    } catch (err) {
      // ignore storage failures
    }
    router.push("/sign-in?role=candidate");
  };

  const submitApplication = async (): Promise<void> => {
    if (!isAuthenticated) {
      redirectToLoginForApply();
      return;
    }

    if (isAuthenticated && !isProfileComplete()) {
      const missingFields = [];
      if (!candidateProfile?.full_name) missingFields.push("full name");
      if (!userEmail) missingFields.push("email address");

      if (missingFields.length > 0) {
        const fieldText = missingFields.join(", ");
        showError(`Please provide: ${fieldText}`);
        return;
      }

      showError("Please complete your profile first before applying for jobs");
      return;
    }

    if (!id) {
      showError("Job ID missing.");
      return;
    }

    try {
      setApplying(true);

      const formData = new FormData();
      formData.append("job_id", id);

      if (isAuthenticated && candidateProfile) {
        if (coverLetter) formData.append("cover_letter", coverLetter);
        if (candidateProfile.resume_path) {
          formData.append("resume_path", candidateProfile.resume_path);
        }
      } else {
        if (coverLetter) formData.append("cover_letter", coverLetter);
      }

      const res = await api.post(`/jobs/apply/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.ok) {
        showSuccess("You have successfully applied for this job!");
        setApplied(true);
        setIsApplied(true);
        setIsSaved(false);
        setCoverLetter("");
        setUpdateResumeFile(null);
      } else {
        showError(
          res.data?.error ||
            res.data?.message ||
            "Failed to submit application",
        );
      }
    } catch (err: any) {
      console.error("Apply error:", err);
      showError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message ||
          "Server error while applying",
      );
    } finally {
      setApplying(false);
    }
  };

  const logoUrl = job?.logoPath
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/${job.logoPath}`
    : null;

  const getOgImageUrl = (): string => {
    if (job?.logoPath) {
      if (job.logoPath.startsWith("http")) {
        return job.logoPath;
      }
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const logoPath = job.logoPath.startsWith("/")
        ? job.logoPath
        : `/${job.logoPath}`;
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : apiBase;
      if (logoPath.includes("/uploads/")) {
        return `${apiBase}${logoPath}`;
      }
      return `${baseUrl}${logoPath}`;
    }
    return `${typeof window !== "undefined" ? window.location.origin : ""}/og-image.jpg`;
  };

  if (loading) return <div className="p-6 text-gray-600">Loading job...</div>;
  if (error) return <div className="p-6 text-primary-600">{error}</div>;
  if (!job) return <div className="p-6 text-gray-600">Job not found</div>;

  const salary = formatSalaryMonthly();
  const experience = formatExperience();
  const jobTitle = getJobTitle(job);
  const jobLocation = formatLocation(job);
  const jobDescription =
    job.description?.substring(0, 160) ||
    `Apply for ${jobTitle} at ${job.company}`;

  return (
    <div className="min-h-screen bg-bg">
      {jobPostingSchema && process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(jobPostingSchema, null, 2),
              );
              showSuccess("JobPosting schema copied to clipboard!");
            }}
            className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700"
          >
            Copy Schema
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="card border border-gray-200 shadow-sm rounded-2xl">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-text-dark">
                  Job Details
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
                {/* Logo and Title */}
                <div className="flex items-start gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${job.company} logo`}
                      className="h-16 w-16 object-contain rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                      {jobTitle}
                    </h1>
                  </div>
                </div>

 
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                  {/* Company */}
                  <div>
                    <label className="text-xs text-gray-500">Company</label>
                    <p className="text-sm font-medium text-gray-800">{job.company}</p>
                  </div>

                  {/* Work Mode */}
                  {job.workMode && (
                    <div>
                      <label className="text-xs text-gray-500">Work Mode</label>
                      <p className="text-sm font-medium text-gray-800">
                        {job.workMode}
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {experience && (
                    <div>
                      <label className="text-xs text-gray-500">Experience</label>
                      <p className="text-sm font-medium text-gray-800">
                        {experience}
                      </p>
                    </div>
                  )}

                  {/* Vacancies */}
                  {job.vacancies && job.vacancies > 0 && (
                    <div>
                      <label className="text-xs text-gray-500">Vacancies</label>
                      <p className="text-sm font-medium text-gray-800">
                        {job.vacancies}
                      </p>
                    </div>
                  )}

                  {/* Job Type */}
                  {job.type && (
                    <div>
                      <label className="text-xs text-gray-500">Job Type</label>
                      <p className="text-sm font-medium text-gray-800">{job.type}</p>
                    </div>
                  )}

                  {/* Location */}
                  {jobLocation && (
                    <div>
                      <label className="text-xs text-gray-500">Location</label>
                      <p className="text-sm font-medium text-gray-800 break-words">
                        {jobLocation}
                      </p>
                    </div>
                  )}

                  {/* Salary */}
                  {salary && (
                    <div>
                      <label className="text-xs text-gray-500">Salary</label>
                      <p className="text-sm font-medium text-gray-800 break-words">
                        {salary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description Card */}
            {job.description && (
              <div className="card border border-gray-200 shadow-sm rounded-2xl">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Job Description
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Card */}
            {skills.length > 0 && (
              <div className="card border border-gray-200 shadow-sm rounded-2xl">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Skills / Technologies
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-700 bg-gray-50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Card */}
            {((job.interviewAddress && job.showInterviewAddress !== false) ||
              job.contactEmail ||
              (job.contactPhone && job.showContactPhone !== false)) && (
              <div className="card border border-gray-200 shadow-sm rounded-2xl">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Contact Information
                    </h2>
                    {getContactAccessLevel() !== "full" && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Lock size={12} />
                        {!isAuthenticated
                          ? "Sign in to view"
                          : "Apply to unlock"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Interview/Office Address */}
                  {job.interviewAddress &&
                    job.showInterviewAddress !== false && (
                      <div className="flex items-start gap-3">
                        <MapPinned
                          size={18}
                          className="text-primary-500 flex-shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                            Interview / Office Address
                          </label>
                          {getContactAccessLevel() === "full" ||
                          getContactAccessLevel() === "partial" ? (
                            <p className="text-text-dark mt-1">
                              {job.interviewAddress}
                            </p>
                          ) : (
                            <p className="text-text-muted mt-1 font-mono text-sm">
                              {maskAddress(job.interviewAddress)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Contact Email */}
                  {job.contactEmail && (
                    <div className="flex items-start gap-3">
                      <Mail
                        size={18}
                        className="text-[#dc2626] flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Contact Email
                        </label>
                        {getContactAccessLevel() === "full" ? (
                          <p className="text-gray-600 mt-1">
                            <a
                              href={`mailto:${job.contactEmail}`}
                              className="text-[#dc2626] hover:underline"
                            >
                              {job.contactEmail}
                            </a>
                          </p>
                        ) : (
                          <p className="text-gray-600 mt-1 font-mono text-sm">
                            {maskEmail(job.contactEmail)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Phone */}
                  {job.contactPhone && job.showContactPhone !== false && (
                    <div className="flex items-start gap-3">
                      <Phone
                        size={18}
                        className="text-[#dc2626] flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Contact Phone
                        </label>
                        {getContactAccessLevel() === "full" ? (
                          <p className="text-gray-600 mt-1">
                            <a
                              href={`tel:${job.contactPhone}`}
                              className="text-[#dc2626] hover:underline"
                            >
                              {job.contactPhone}
                            </a>
                          </p>
                        ) : (
                          <p className="text-gray-600 mt-1 font-mono text-sm">
                            {maskPhone(job.contactPhone)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Helper message for candidates who haven't applied */}
                  {getContactAccessLevel() === "partial" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
                        <Lock size={14} />
                        Apply to this job to unlock full contact details
                      </p>
                    </div>
                  )}

                  {/* Helper message for guests */}
                  {getContactAccessLevel() === "masked" && !isAuthenticated && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
                        <Lock size={14} />
                        Sign in to view contact details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Apply Section */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="card border border-gray-200 shadow-sm rounded-2xl">
              <div className="border-b border-gray-200 p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {shouldHideActionButtons()
                      ? "Job Summary"
                      : "Apply to this job"}
                  </h2>
                  {!shouldHideActionButtons() && !isApplied && (
                    <button
                      onClick={toggleSave}
                      className="flex items-center font-medium gap-1.5 border-2 border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEF2F2] hover:text-[#7F1414] text-xs px-3 py-1.5 rounded-xl transition-colors"
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck
                            size={14}
                            className="text-[#AD1717]"
                          />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} />
                          Save
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {shouldHideActionButtons() && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-center">
                      <p className="text-gray-700 font-medium">
                        {isOwnJob() ? (
                          <>You posted this job</>
                        ) : userRole === "admin" ? (
                          <>Viewing as Admin</>
                        ) : (
                          <>Viewing as Recruiter</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {!shouldHideActionButtons() && isAuthenticated && isApplied && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                        <CheckCircle2 size={20} />
                        Applied ✓
                      </div>
                      <p className="text-emerald-700/80 text-sm mt-2">
                        You have successfully applied to this job
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Contact details are now unlocked for you
                    </p>
                  </div>
                )}

                {!shouldHideActionButtons() &&
                  isAuthenticated &&
                  !isApplied &&
                  candidateProfile && (
                    <div className="space-y-4">
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 sm:p-4 text-sm">
                        <div className="font-semibold text-primary-900 mb-1.5">
                          Applying as:
                        </div>
                        <div className="text-gray-800 font-medium">
                          {candidateProfile.full_name || "Your name"}
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          {userEmail}
                        </div>
                      </div>

                      {candidateProfile.resume_path && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Resume
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  viewResume(
                                    candidateProfile.resume_path,
                                    candidateProfile.full_name || "candidate",
                                  )
                                }
                                className="text-xs text-[#AD1717] hover:text-[#7F1414] underline font-medium"
                              >
                                View
                              </button>
                              <span className="text-xs text-gray-400">|</span>
                              <button
                                type="button"
                                onClick={() =>
                                  document
                                    .getElementById("update-resume-input")
                                    ?.click()
                                }
                                className="text-xs text-[#AD1717] hover:text-[#7F1414] underline font-medium"
                              >
                                Update
                              </button>
                            </div>
                          </div>
                          <input
                            id="update-resume-input"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={async (e) => {
                              const f = e.target.files?.[0] || null;
                              if (!f) {
                                setUpdateResumeFile(null);
                                return;
                              }
                              const allowed = [".pdf", ".doc", ".docx"];
                              const ext = f.name
                                .substring(f.name.lastIndexOf("."))
                                .toLowerCase();
                              if (!allowed.includes(ext)) {
                                setError(
                                  "Only PDF / DOC / DOCX files are allowed for resume.",
                                );
                                setUpdateResumeFile(null);
                                return;
                              }
                              const maxSize = 5 * 1024 * 1024;
                              if (f.size > maxSize) {
                                setError("Resume must be smaller than 5 MB.");
                                setUpdateResumeFile(null);
                                return;
                              }

                              setError(null);

                              try {
                                const formData = new FormData();
                                formData.append("resume", f);
                                formData.append("user_id", userId as string);

                                const uploadRes = await api.post(
                                  "/profile/upload-resume",
                                  formData,
                                  {
                                    headers: {
                                      "Content-Type": "multipart/form-data",
                                    },
                                  },
                                );

                                if (uploadRes?.data?.success) {
                                  setCandidateProfile((prev) => ({
                                    ...prev,
                                    resume_path: uploadRes.data.resume_path,
                                  }));
                                  showSuccess("Resume updated successfully!");
                                  e.target.value = "";
                                } else {
                                  showError("Failed to upload resume");
                                }
                              } catch (err: any) {
                                console.error("Resume upload error:", err);
                                showError(
                                  err?.response?.data?.error ||
                                    "Failed to upload resume",
                                );
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cover letter (optional)
                        </label>
                        <textarea
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#B51818] focus:ring-2 focus:ring-[#B51818]/20"
                          placeholder="Tell us why you're a good fit for this role..."
                        />
                      </div>

                      {candidateProfile && (
                        <>
                          <div className="space-y-3">
                            <button
                              className="w-full rounded-xl bg-[#B51818] hover:bg-[#9A1414] px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={submitApplication}
                              disabled={applying || applied || profileLoading}
                            >
                              {applied
                                ? "Applied"
                                : applying
                                  ? "Applying..."
                                  : "Apply Now"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                {!shouldHideActionButtons() &&
                  isAuthenticated &&
                  !isApplied &&
                  !candidateProfile &&
                  !profileLoading && (
                    <div className="space-y-4">
                      <button
                        className="w-full rounded-xl bg-[#B51818] hover:bg-[#9A1414] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                        onClick={() => {
                          try {
                            const currentPath =
                              window.location.pathname + window.location.search;
                            localStorage.setItem("postLoginApplyJobId", id);
                            localStorage.setItem(
                              "postLoginRedirect",
                              currentPath || `/jobs/${id}`,
                            );
                          } catch (err) {
                            // ignore storage failures
                          }
                          router.push("/dashboard/profile");
                        }}
                      >
                        Create Profile to Apply Now
                      </button>
                      <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">
                        🔓 Create your profile to apply and unlock recruiter
                        contact details
                      </p>
                    </div>
                  )}

                {!shouldHideActionButtons() && !isAuthenticated && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4 text-sm text-center">
                      <Lock size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-400 font-medium">
                        Sign in to apply and view full contact details
                      </p>
                    </div>
                    <button
                      className="text-white bg-[#B51818] hover:bg-[#9A1414] w-full py-2 px-4 rounded-xl font-semibold transition-colors"
                      onClick={redirectToLoginForApply}
                    >
                      Sign in to Apply
                    </button>
                  </div>
                )}

                {!shouldHideActionButtons() &&
                  isAuthenticated &&
                  !isApplied &&
                  profileLoading && (
                    <div className="space-y-4">
                      <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
                      <div className="animate-pulse bg-gray-100 h-10 rounded-lg"></div>
                    </div>
                  )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}