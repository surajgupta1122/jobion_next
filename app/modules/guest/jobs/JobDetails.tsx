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
import Head from "next/head";
import { useToast } from "../../../components/toast/ToastContext";
import api from "../../../components/apiconfig/apiconfig";

// Types
interface Job {
  id: string | number;
  title: string;
  company: string;
  description?: string;
  type?: string;
  workMode?: string;
  location?: string;
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
  city?: string | null;
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

// Utility functions to mask contact information
const maskPhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••• ••••";
  const lastFour = digits.slice(-4);
  // Format: +91 •••• ••1234
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
  // Show first 15 characters, then mask the rest
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

export default function JobDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [jobPostingSchema, setJobPostingSchema] =
    useState<JobPostingSchema | null>(null);
  const [loading, setLoading] = useState(true);
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
  // Returns: 'full' | 'partial' | 'masked'
  const getContactAccessLevel = (): "full" | "partial" | "masked" => {
    // Guest user - all masked
    if (!isAuthenticated) return "masked";

    // Admin or recruiter - full access
    if (userRole === "admin" || userRole === "recruiter") return "full";

    // Candidate who has applied - full access
    if (userRole === "candidate" && isApplied) return "full";

    // Candidate who hasn't applied - partial (address visible, phone/email masked)
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
        // If applied, also set isSaved to false (since applied jobs can't be saved)
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
        setLoading(true);
        const { data } = await api.get(`/jobs/${id}`);
        if (!alive) return;
        if (data.ok && data.job) {
          setJob(data.job);
          setJobPostingSchema(data.jobPostingSchema);

          // Check if job is saved
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
  }, [id]);

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

            // Only fetch candidate profile and check applied status for candidates
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

  // Load candidate profile for logged-in users
  const loadCandidateProfile = async (): Promise<void> => {
    setProfileLoading(true);
    try {
      const res = await api.get("/profile/user");
      if (res?.data?.success && res.data.user) {
        setCandidateProfile(res.data.user);
      }
    } catch (err) {
      // Profile doesn't exist or error - that's okay, user will need to complete it
      setCandidateProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Check if profile is complete (has name and email - resume is always optional)
  const isProfileComplete = (): boolean => {
    if (!candidateProfile) return false;

    const hasBasicInfo = !!(candidateProfile.full_name && userEmail);

    // Resume is always optional regardless of qualification
    return hasBasicInfo;
  };

  // Check if job is saved
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
    // Recruiters and admins should not save jobs
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
        // Unsave the job
        await api.delete(`/jobs/save/${id}`);
        setIsSaved(false);
      } else {
        // Save the job
        await api.post(`/jobs/save/${id}`);
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error("Error toggling save:", error);
      const errorMessage = error.response?.data?.message || error.message;
      // Show specific message if trying to save an applied job
      if (errorMessage.includes("already applied")) {
        alert("Cannot save a job you have already applied to");
        setIsApplied(true);
      } else {
        alert("Error: " + errorMessage);
      }
    }
  };

  const skills = job?.tags || [];

  // Format salary (monthly) with rupee symbol - returns null if no salary data
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

  // Format experience - returns null if no experience data
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

  // Redirect to login for non-logged-in users
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
    // Check authentication first
    if (!isAuthenticated) {
      redirectToLoginForApply();
      return;
    }

    // For logged-in users: check if profile is complete
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
        // For logged-in users: use profile data
        // Only send cover letter
        if (coverLetter) formData.append("cover_letter", coverLetter);

        // Always use the current resume_path from profile (updated immediately when user selects new file)
        if (candidateProfile.resume_path) {
          formData.append("resume_path", candidateProfile.resume_path);
        }
      } else {
        // Non-logged-in users should be redirected to login
        // This case shouldn't happen as we redirect above
        if (coverLetter) formData.append("cover_letter", coverLetter);
      }

      const res = await api.post("/jobs/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.ok) {
        showSuccess("You have successfully applied for this job!");
        setApplied(true);
        setIsApplied(true); // Mark as applied
        // Remove from saved jobs (if it was saved) - backend handles this automatically
        setIsSaved(false);
        // Clear form
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

  // Get logo URL for display
  const logoUrl = job?.logoPath
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/${job.logoPath}`
    : null;

  // Get OG image URL (use full URL with proper domain)
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

  // Render
  if (loading) return <div className="p-6 text-gray-600">Loading job...</div>;
  if (error) return <div className="p-6 text-primary-600">{error}</div>;
  if (!job) return <div className="p-6 text-gray-600">Job not found</div>;

  const salary = formatSalaryMonthly();
  const experience = formatExperience();
  const ogImageUrl = getOgImageUrl();
  const jobDescription =
    job.description?.substring(0, 160) ||
    `Apply for ${job.title} at ${job.company}`;
  const jobUrl = `${window.location.origin}/jobs/${job.id}`;

  return (
    <div className="min-h-screen bg-bg">
      <Head>
        <title>{`${job.title} - ${job.company} | Jobion`}</title>
        <meta name="description" content={jobDescription} />
        <meta
          name="keywords"
          content={`${job.title}, ${job.company}, jobs, career, employment, ${job.city || ""}, ${job.workMode || ""}`}
        />
        <meta property="og:title" content={`${job.title} - ${job.company}`} />
        <meta property="og:description" content={jobDescription} />
        <meta property="og:url" content={jobUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content={`${job.company} - ${job.title}`}
        />
        <meta property="og:site_name" content="Jobion" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${job.title} - ${job.company}`} />
        <meta name="twitter:description" content={jobDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta
          name="twitter:image:alt"
          content={`${job.company} - ${job.title}`}
        />
        <meta name="author" content="Jobion" />
        <meta name="theme-color" content="#BB1919" />
        <link rel="canonical" href={jobUrl} />
        {jobPostingSchema && (
          <script type="application/ld+json">
            {JSON.stringify(jobPostingSchema, null, 2)}
          </script>
        )}
      </Head>

      {/* Add developer utility for schema copying */}
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
                      {job.title}
                    </h1>
                    {job.company && (
                      <p className="font-medium text-gray-400 mt-1">{job.company}</p>
                    )}
                  </div>
                </div>

                {/* Quick Info Row */}
                <div className="flex flex-wrap gap-2">
                  {job.type && (
                    <span className="border border-gray-300 rounded-xl px-2 py-0.5 bg-gray-100 inline-flex items-center text-gray-800 text-sm gap-1">
                      <Briefcase size={14} /> {job.type}
                    </span>
                  )}
                  {job.workMode && (
                    <span className="border border-gray-300 rounded-xl px-2 py-0.5 bg-gray-100 inline-flex items-center text-gray-800 text-sm gap-1">
                      <Clock size={14} /> {job.workMode}
                    </span>
                  )}
                  {job.location && (
                    <span className="border border-gray-300 rounded-xl px-2 py-0.5 bg-gray-100 inline-flex items-center text-gray-800 text-sm gap-1">
                      <MapPin size={14} /> {job.location}
                    </span>
                  )}
                  {experience && (
                    <span className="border border-gray-300 rounded-xl px-2 py-0.5 bg-gray-100 inline-flex items-center text-gray-800 text-sm gap-1">
                      <GraduationCap size={14} /> {experience}
                    </span>
                  )}
                  {job.vacancies && job.vacancies > 0 && (
                    <span className="border border-gray-300 rounded-xl px-2 py-0.5 bg-gray-100 inline-flex items-center text-gray-800 text-sm gap-1">
                      <Users size={14} /> {job.vacancies}{" "}
                      {job.vacancies === 1 ? "Vacancy" : "Vacancies"}
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  {job.company && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </label>
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {job.company}
                      </p>
                    </div>
                  )}
                  {job.type && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Type
                      </label>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {job.type}
                      </p>
                    </div>
                  )}
                  {job.workMode && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Mode
                      </label>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {job.workMode}
                      </p>
                    </div>
                  )}
                  {job.location && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </label>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {job.location}
                      </p>
                    </div>
                  )}
                  {experience && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </label>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {experience}
                      </p>
                    </div>
                  )}
                  {salary && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </label>
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {salary}
                      </p>
                    </div>
                  )}
                  {job.vacancies && job.vacancies > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vacancies
                      </label>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {job.vacancies}
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
                        className="text-primary-500 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                          Contact Email
                        </label>
                        {getContactAccessLevel() === "full" ? (
                          <p className="text-text-dark mt-1">
                            <a
                              href={`mailto:${job.contactEmail}`}
                              className="text-primary-600 hover:underline"
                            >
                              {job.contactEmail}
                            </a>
                          </p>
                        ) : (
                          <p className="text-text-muted mt-1 font-mono text-sm">
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
                        className="text-primary-500 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                          Contact Phone
                        </label>
                        {getContactAccessLevel() === "full" ? (
                          <p className="text-text-dark mt-1">
                            <a
                              href={`tel:${job.contactPhone}`}
                              className="text-primary-600 hover:underline"
                            >
                              {job.contactPhone}
                            </a>
                          </p>
                        ) : (
                          <p className="text-text-muted mt-1 font-mono text-sm">
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
                  {/* Show Save button only for candidates who haven't applied */}
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
                {/* Quick Summary */}

                {/* STATE 4 & 5: Recruiter or Admin viewing job - No action buttons */}
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

                {/* STATE 3: Candidate who has applied */}
                {!shouldHideActionButtons() && isAuthenticated && isApplied && (
                  <div className="space-y-4">
                    <div className="bg-success-light border border-success-300 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-success-700 font-semibold">
                        <CheckCircle2 size={20} />
                        Applied ✓
                      </div>
                      <p className="text-success-600 text-sm mt-2">
                        You have successfully applied to this job
                      </p>
                    </div>
                    <p className="text-xs text-text-muted text-center">
                      Contact details are now unlocked for you
                    </p>
                  </div>
                )}

                {/* STATE 2: Logged-in candidate who hasn't applied */}
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
                            <label className="label text-sm">Resume</label>
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

                              // Clear any previous errors
                              setError(null);

                              try {
                                // Upload the file immediately to update profile
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
                                  // Update the candidate profile with new resume path
                                  setCandidateProfile((prev) => ({
                                    ...prev,
                                    resume_path: uploadRes.data.resume_path,
                                  }));
                                  showSuccess("Resume updated successfully!");

                                  // Clear the file input
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
                        <label className="label text-sm">
                          Cover letter (optional)
                        </label>
                        <textarea
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          className="textarea"
                          placeholder="Tell us why you're a good fit for this role..."
                        />
                      </div>

                      {/* Resume Section */}
                      {candidateProfile && (
                        <>
                          <div className="space-y-3">
                            <button
                              className="btn btn-primary btn-md w-full"
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

                {/* STATE 2 (alt): Logged-in candidate without profile loaded yet */}
                {!shouldHideActionButtons() &&
                  isAuthenticated &&
                  !isApplied &&
                  !candidateProfile &&
                  !profileLoading && (
                    <div className="space-y-4">
                      <button
                        className="btn btn-primary btn-md w-full"
                        onClick={() => {
                          // Store job info for redirect after profile creation
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

                {/* STATE 1: Guest user (not logged in) */}
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

                {/* Loading state */}
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
