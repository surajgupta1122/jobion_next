"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
  Clock,
  Search,
  ArrowUpRight,
  Globe,
  Monitor,
  Building,
  Filter,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../../components/apiconfig/apiconfig";

// Static filter options (frontend constants)
const SALARY_OPTIONS = [
  { label: "More than ₹ 5000", value: 5000 },
  { label: "More than ₹ 10000", value: 10000 },
  { label: "More than ₹ 20000", value: 20000 },
  { label: "More than ₹ 30000", value: 30000 },
  { label: "More than ₹ 40000", value: 40000 },
  { label: "More than ₹ 50000", value: 50000 },
];

// Static job type filter options (from jobs.job_type enum)
const JOB_TYPE_OPTIONS = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Internship", value: "internship" },
  { label: "Contract", value: "contract" },
];

// Static work mode filter options (from jobs.work_mode enum)
const WORK_MODE_OPTIONS = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Office", value: "office" },
];

// Static experience filter ranges
const EXPERIENCE_OPTIONS = [
  { label: "Fresher (0 years)", value: "0" },
  { label: "0-2 years", value: "0-2" },
  { label: "2-5 years", value: "2-5" },
  { label: "5-10 years", value: "5-10" },
  { label: "10+ years", value: "10+" },
];

const pageSize = 6;

const parseSalaryValue = (salary: any): number | null => {
  if (!salary) return null;
  const numeric = `${salary}`.replace(/[^0-9]/g, "");
  if (!numeric) return null;
  return Number(numeric);
};

const formatSalary = (salary: any, minSalary: any, maxSalary: any): string => {
  // Use minSalary and maxSalary if available (preferred)
  if (minSalary != null && maxSalary != null) {
    return `₹ ${Number(minSalary).toLocaleString("en-IN")} - ${Number(maxSalary).toLocaleString("en-IN")}`;
  } else if (minSalary != null) {
    return `₹ ${Number(minSalary).toLocaleString("en-IN")}+`;
  } else if (maxSalary != null) {
    return `Up to ₹ ${Number(maxSalary).toLocaleString("en-IN")}`;
  }

  // Fallback: try to parse from salary string if min/max not available
  const numeric = parseSalaryValue(salary);
  if (!numeric) return salary || "";
  return `₹ ${numeric.toLocaleString("en-IN")}`;
};

export default function Jobs() {
  const [jobList, setJobList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Dynamic filter options (from backend)
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<any[]>([]); // from job_roles
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  // Mobile filters state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedMobileCategory, setSelectedMobileCategory] = useState<
    string | null
  >(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isClearingFilters = useRef(false);

  // Check auth and redirect recruiters to their job listing page
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/session");
        if (alive) {
          setIsAuthenticated(Boolean(data?.user));
          setUserRole(data?.user?.role || null);

          // Redirect recruiters and admins away from candidate job browsing
          if (data?.user?.role === "recruiter") {
            router.replace("/job-posted");
            return;
          }
          if (data?.user?.role === "admin") {
            router.replace("/admin/jobs");
            return;
          }
        }
      } catch (err) {
        if (alive) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } finally {
        if (alive) setAuthChecked(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    // Skip if we're in the process of clearing filters
    if (isClearingFilters.current) {
      isClearingFilters.current = false;
      return;
    }

    const searchQuery = searchParams.get("search") || "";
    const qParam = searchParams.get("q") || "";
    const locationParam = searchParams.get("location") || "";
    const experienceParam = searchParams.get("experience") || "";

    // Set search term from URL params
    if (searchQuery) {
      setSearchTerm(searchQuery);
    } else if (qParam) {
      setSearchTerm(qParam);
    } else if (!searchQuery && !qParam) {
      // Clear search term if no search params in URL
      setSearchTerm("");
    }
  }, [searchParams]);

  // Fetch filter options from backend
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get("/jobs/filters");
        if (!alive) return;

        if (data.ok && data.filters) {
          setCityOptions(data.filters.cities || []);
          // Prefer structured roles from backend (id + name), fallback to legacy titles (strings)
          if (Array.isArray(data.filters.roles) && data.filters.roles.length) {
            setRoleOptions(data.filters.roles);
          } else if (
            Array.isArray(data.filters.titles) &&
            data.filters.titles.length
          ) {
            setRoleOptions(
              data.filters.titles.map((name: string, idx: number) => ({
                id: idx + 1,
                name,
              })),
            );
          }
          setTagOptions(data.filters.tags || []);
        }
      } catch (err) {
        console.error("Error fetching filters:", err);
        // Continue without filters if endpoint fails
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Auto-select filters from URL params (q, location, experience) after filter options are loaded
  useEffect(() => {
    // Use the searchParams hook value from above
    const qParam = searchParams.get("q") || "";
    const locationParam = searchParams.get("location") || "";
    const experienceParam = searchParams.get("experience") || "";

    // If no URL params, skip
    if (!qParam && !locationParam && !experienceParam) {
      return;
    }

    // Match job role from q param (wait for roleOptions to be loaded)
    if (qParam && roleOptions.length > 0) {
      const matchedRole = roleOptions.find(
        (role) =>
          role.name.toLowerCase().includes(qParam.toLowerCase()) ||
          qParam.toLowerCase().includes(role.name.toLowerCase()),
      );
      if (matchedRole) {
        setSelectedRoles((prev) => {
          if (prev.includes(matchedRole.name)) return prev;
          return [...prev, matchedRole.name];
        });
      }
    }

    // Match city from location param (wait for cityOptions to be loaded)
    if (locationParam && cityOptions.length > 0) {
      const matchedCity = cityOptions.find(
        (city) =>
          city.toLowerCase() === locationParam.toLowerCase() ||
          city.toLowerCase().includes(locationParam.toLowerCase()) ||
          locationParam.toLowerCase().includes(city.toLowerCase()),
      );
      if (matchedCity) {
        setSelectedCities((prev) => {
          if (prev.includes(matchedCity)) return prev;
          return [...prev, matchedCity];
        });
      }
    }

    // Map experience param to experience filter value (can be set immediately, no need to wait)
    if (experienceParam) {
      let experienceValue = "";
      switch (experienceParam.toLowerCase()) {
        case "fresher":
          experienceValue = "0";
          break;
        case "mid":
          experienceValue = "0-2";
          break;
        case "senior":
          experienceValue = "2-5"; // Default for "2+ years"
          break;
        default:
          // If it's already a valid experience value, use it directly
          if (EXPERIENCE_OPTIONS.some((opt) => opt.value === experienceParam)) {
            experienceValue = experienceParam;
          }
          break;
      }
      if (experienceValue) {
        setSelectedExperience(experienceValue);
      }
    }
  }, [searchParams, cityOptions, roleOptions]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const apiParams: Record<string, any> = { limit: 100 };
        const { data } = await api.get("/jobs", { params: apiParams });

        if (!alive) return;

        if (data.ok && Array.isArray(data.jobs)) {
          const mapped = data.jobs.map((j: any) => ({
            id: j._id || j.id,
            roleId:
              j.roleId != null
                ? j.roleId
                : j.role_id != null
                  ? j.role_id
                  : null,
            roleName: j.roleName || j.role_name || "",
            title: j.title || j.jobTitle || "",
            company: j.company || j.companyName || "",
            location: j.location || j.jobLocation || "",
            city: j.city || "", // Store city separately for filtering (from backend)
            type: j.type || j.jobType || "Full Time",
            // Normalize job type for filtering (handle variations like "Full-time", "Full Time", "full-time")
            jobType: (j.type || j.jobType || "full-time")
              .toLowerCase()
              .replace(/\s+/g, "-"),
            workMode: j.workMode || j.mode || j.workType || "Office",
            // Normalize work mode for filtering (handle variations like "Office", "office", "Remote", "remote")
            workModeValue: (
              j.workMode ||
              j.mode ||
              j.workType ||
              "office"
            ).toLowerCase(),
            experience: j.experience || j.experiance || j.exp || "",
            minExperience:
              j.minExperience != null
                ? j.minExperience
                : j.min_experience != null
                  ? j.min_experience
                  : null,
            maxExperience:
              j.maxExperience != null
                ? j.maxExperience
                : j.max_experience != null
                  ? j.max_experience
                  : null,
            skills: j.skills || j.tags || [],
            salary: j.salary || "",
            minSalary:
              j.minSalary != null
                ? j.minSalary
                : j.min_salary != null
                  ? j.min_salary
                  : null,
            maxSalary:
              j.maxSalary != null
                ? j.maxSalary
                : j.max_salary != null
                  ? j.max_salary
                  : null,
            vacancies: j.vacancies || "",
            description: j.description || "",
          }));
          setJobList(mapped);
          setFiltered(mapped);

          await checkSavedStatusForJobs(mapped);
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [searchParams]);

  const checkSavedStatusForJobs = async (jobs: any[]) => {
    const status: Record<string, boolean> = {};
    for (const job of jobs) {
      try {
        const response = await api.get(`/jobs/save/${job.id}`);
        status[job.id] = response.data.isSaved;
      } catch (error) {
        status[job.id] = false;
      }
    }
    setSavedStatus(status);
  };

  const redirectToLoginForSave = (jobId: string) => {
    try {
      const currentPath = pathname + "?" + searchParams.toString();
      localStorage.setItem("postLoginSaveJobId", jobId);
      localStorage.setItem("postLoginRedirect", currentPath || "/jobs");
    } catch (err) {
      // fail silently if storage not available
    }
    router.push("/sign-in");
  };

  const toggleSaveJob = async (jobId: string, isCurrentlySaved: boolean) => {
    if (!isAuthenticated) {
      // If auth status is still being checked, try one more quick check
      if (!authChecked) {
        try {
          const { data } = await api.get("/auth/session");
          if (data?.user) {
            setIsAuthenticated(true);
          } else {
            redirectToLoginForSave(jobId);
            return;
          }
        } catch (err) {
          redirectToLoginForSave(jobId);
          return;
        }
      } else {
        redirectToLoginForSave(jobId);
        return;
      }
    }

    try {
      if (isCurrentlySaved) {
        await api.delete(`/jobs/save/${jobId}`);
        setSavedStatus((prev) => ({ ...prev, [jobId]: false }));
      } else {
        await api.post(`/jobs/save/${jobId}`);
        setSavedStatus((prev) => ({ ...prev, [jobId]: true }));
      }
    } catch (error: any) {
      alert(
        "Error saving job: " +
          (error?.response?.data?.message || error?.message || "Try again"),
      );
    }
  };

  const applyFilters = useCallback(() => {
    if (jobList.length === 0) return;

    let data = [...jobList];
    const query = searchTerm.trim().toLowerCase();

    if (query) {
      data = data.filter((job) => {
        const textBucket = [
          job.title,
          job.company,
          job.location,
          job.description,
          ...(job.skills || []),
        ]
          .join(" ")
          .toLowerCase();
        return textBucket.includes(query);
      });
    }

    if (selectedCities.length) {
      data = data.filter((job) =>
        selectedCities.some((city) => {
          // Match against city field or location string
          const jobCity = (job.city || "").toLowerCase();
          const jobLocation = (job.location || "").toLowerCase();
          return (
            jobCity === city.toLowerCase() ||
            jobLocation.includes(city.toLowerCase())
          );
        }),
      );
    }

    if (selectedRoles.length) {
      data = data.filter((job) =>
        selectedRoles.some((role) => {
          const roleLc = role.toLowerCase();
          const jobRoleName = (job.roleName || "").toLowerCase();
          const jobTitle = (job.title || "").toLowerCase();
          // Prefer matching against normalized roleName from job_roles,
          // but fall back to title for legacy data
          return (
            (jobRoleName && jobRoleName.includes(roleLc)) ||
            (!jobRoleName && jobTitle.includes(roleLc))
          );
        }),
      );
    }

    if (selectedJobTypes.length) {
      data = data.filter((job) => {
        // Normalize job type for comparison
        const normalizedJobType = job.jobType
          .toLowerCase()
          .replace(/\s+/g, "-");
        return selectedJobTypes.some((type) => {
          const normalizedType = type.toLowerCase().replace(/\s+/g, "-");
          return (
            normalizedJobType === normalizedType ||
            normalizedJobType.includes(normalizedType)
          );
        });
      });
    }

    if (selectedWorkModes.length) {
      data = data.filter((job) => {
        // Normalize work mode for comparison
        const normalizedWorkMode = job.workModeValue.toLowerCase();
        return selectedWorkModes.some((mode) => {
          const normalizedMode = mode.toLowerCase();
          return normalizedWorkMode === normalizedMode;
        });
      });
    }

    if (selectedExperience) {
      data = data.filter((job) => {
        const minExp = job.minExperience != null ? job.minExperience : 0;
        const maxExp = job.maxExperience != null ? job.maxExperience : 100;

        switch (selectedExperience) {
          case "0":
            return minExp === 0; // Only check min experience, ignore max experience
          case "0-2":
            return minExp >= 0 && maxExp <= 2;
          case "2-5":
            return minExp >= 2 && maxExp <= 5;
          case "5-10":
            return minExp >= 5 && maxExp <= 10;
          case "10+":
            return minExp >= 10;
          default:
            return true;
        }
      });
    }

    if (salaryFilter) {
      const threshold = Number(salaryFilter);
      data = data.filter((job) => {
        // Check min_salary first, then fallback to parsing salary string
        if (job.minSalary != null) {
          return job.minSalary >= threshold;
        }
        const numeric = parseSalaryValue(job.salary);
        if (!numeric) return true; // keep jobs without salary info
        return numeric >= threshold;
      });
    }

    setFiltered(data);
    setPage(1);

    const params = new URLSearchParams();
    if (query) params.set("search", query);
    const newUrl = params.toString() ? `/jobs?${params.toString()}` : "/jobs";
    router.replace(newUrl);
  }, [
    jobList,
    searchTerm,
    selectedCities,
    selectedRoles,
    selectedJobTypes,
    selectedWorkModes,
    selectedExperience,
    salaryFilter,
    router,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Filter out saved jobs from the list
  const filteredWithoutSaved = useMemo(
    () => filtered.filter((job) => !savedStatus[job.id]),
    [filtered, savedStatus],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredWithoutSaved.length / pageSize)),
    [filteredWithoutSaved.length],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginated = useMemo(
    () => filteredWithoutSaved.slice((page - 1) * pageSize, page * pageSize),
    [filteredWithoutSaved, page],
  );

  const startIdx =
    filteredWithoutSaved.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = (page - 1) * pageSize + paginated.length;

  const hasSidebarFilters =
    selectedCities.length > 0 ||
    selectedRoles.length > 0 ||
    selectedJobTypes.length > 0 ||
    selectedWorkModes.length > 0 ||
    Boolean(selectedExperience) ||
    Boolean(salaryFilter);

  const toggleValue = (value: string, setFn: any) => {
    setFn((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((item: string) => item !== value)
        : [...prev, value],
    );
  };

  const clearFilters = () => {
    // Set flag to prevent useEffects from re-applying filters
    isClearingFilters.current = true;

    // Clear all filter states
    setSelectedCities([]);
    setSelectedRoles([]);
    setSelectedJobTypes([]);
    setSelectedWorkModes([]);
    setSelectedExperience("");
    setSalaryFilter("");
    setSearchTerm("");

    // Clear all query parameters from URL
    router.replace("/jobs");
  };

  // Helper to count jobs for each filter option
  const getJobCountForCity = (city: string): number => {
    return jobList.filter((job) => {
      const jobCity = (job.city || "").toLowerCase();
      const jobLocation = (job.location || "").toLowerCase();
      return (
        jobCity === city.toLowerCase() ||
        jobLocation.includes(city.toLowerCase())
      );
    }).length;
  };

  const getJobCountForRoleName = (roleName: string): number => {
    return jobList.filter((job) =>
      (job.roleName || job.title || "")
        .toLowerCase()
        .includes(roleName.toLowerCase()),
    ).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Find Jobs</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredWithoutSaved.length || jobList.length} jobs near you
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[320px] md:min-w-[420px]">
            {/* Mobile-optimized search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 bg-white rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex items-center gap-2 flex-1">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-500"
                  placeholder="Search jobs..."
                />
              </div>
              <button
                onClick={applyFilters}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4 sm:gap-6 lg:gap-8">
        <aside className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden lg:sticky lg:top-4 lg:self-start">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              {hasSidebarFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Dynamic City Filter */}
              {cityOptions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    City
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cityOptions.map((city) => {
                      const active = selectedCities.includes(city);
                      const jobCount = getJobCountForCity(city);
                      if (jobCount === 0) return null; // Hide filters with zero jobs
                      return (
                        <button
                          key={city}
                          onClick={() => toggleValue(city, setSelectedCities)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg border text-sm ${
                            active
                              ? "bg-primary-50 border-primary-200 text-primary-700"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Job Role Filter (from job_roles) */}
              {roleOptions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Job Role(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((role) => {
                      const label = role.name || role;
                      const active = selectedRoles.includes(label);
                      const jobCount = getJobCountForRoleName(label);
                      if (jobCount === 0) return null; // Hide filters with zero jobs
                      return (
                        <button
                          key={role.id || label}
                          onClick={() => toggleValue(label, setSelectedRoles)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg border text-sm ${
                            active
                              ? "bg-primary-50 border-primary-200 text-primary-700"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Static Job Type Filter */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Job Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPE_OPTIONS.map((option) => {
                    const active = selectedJobTypes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          toggleValue(option.value, setSelectedJobTypes)
                        }
                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg border text-sm ${
                          active
                            ? "bg-primary-50 border-primary-200 text-primary-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Static Work Mode Filter */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Work Mode
                </p>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODE_OPTIONS.map((option) => {
                    const active = selectedWorkModes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          toggleValue(option.value, setSelectedWorkModes)
                        }
                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg border text-sm ${
                          active
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Static Experience Filter */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Experience
                </p>
                <div className="space-y-2">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-primary-600 transition-colors"
                    >
                      <input
                        type="radio"
                        name="experience"
                        value={opt.value}
                        checked={selectedExperience === opt.value}
                        onChange={(e) => setSelectedExperience(e.target.value)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Static Salary Filter */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Salary
                </p>
                <div className="space-y-2">
                  {SALARY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-primary-600 transition-colors"
                    >
                      <input
                        type="radio"
                        name="salary"
                        value={opt.value}
                        checked={String(salaryFilter) === String(opt.value)}
                        onChange={(e) => setSalaryFilter(e.target.value)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile filter button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setShowMobileFilters(true);
              // Set default category if none selected
              if (!selectedMobileCategory) {
                if (roleOptions.length > 0) setSelectedMobileCategory("roles");
                else if (cityOptions.length > 0)
                  setSelectedMobileCategory("city");
                else setSelectedMobileCategory("jobType");
              }
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
            aria-label="Open filters"
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Mobile filter modal */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 -ml-2"
                aria-label="Close filters"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
              <button
                onClick={() => {
                  clearFilters();
                  setSelectedMobileCategory(null);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Two-column filter layout */}
            <div className="flex h-[calc(100vh-140px)]">
              {/* Left column - Categories */}
              <div className="w-1/3 bg-gray-100 border-r border-gray-200 overflow-y-auto">
                <div className="space-y-0">
                  {/* Job Roles */}
                  {roleOptions.length > 0 && (
                    <button
                      onClick={() => setSelectedMobileCategory("roles")}
                      className={`w-full text-left px-4 py-4 border-b border-gray-200 transition-colors ${
                        selectedMobileCategory === "roles"
                          ? "bg-white font-semibold"
                          : "bg-gray-100"
                      }`}
                    >
                      <span className="text-sm text-gray-900">
                        Job Roles
                        {selectedRoles.length > 0 && (
                          <span className="ml-1 text-primary-600">
                            ({selectedRoles.length})
                          </span>
                        )}
                      </span>
                    </button>
                  )}

                  {/* Monthly Salary */}
                  <button
                    onClick={() => setSelectedMobileCategory("salary")}
                    className={`w-full text-left px-4 py-4 border-b border-gray-200 transition-colors ${
                      selectedMobileCategory === "salary"
                        ? "bg-white font-semibold"
                        : "bg-gray-100"
                    }`}
                  >
                    <span className="text-sm text-gray-900">
                      Monthly Salary
                      {salaryFilter && (
                        <span className="ml-1 text-primary-600">(1)</span>
                      )}
                    </span>
                  </button>

                  {/* Job Type */}
                  <button
                    onClick={() => setSelectedMobileCategory("jobType")}
                    className={`w-full text-left px-4 py-4 border-b border-gray-200 transition-colors ${
                      selectedMobileCategory === "jobType"
                        ? "bg-white font-semibold"
                        : "bg-gray-100"
                    }`}
                  >
                    <span className="text-sm text-gray-900">
                      Job Type
                      {selectedJobTypes.length > 0 && (
                        <span className="ml-1 text-primary-600">
                          ({selectedJobTypes.length})
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Experience */}
                  <button
                    onClick={() => setSelectedMobileCategory("experience")}
                    className={`w-full text-left px-4 py-4 border-b border-gray-200 transition-colors ${
                      selectedMobileCategory === "experience"
                        ? "bg-white font-semibold"
                        : "bg-gray-100"
                    }`}
                  >
                    <span className="text-sm text-gray-900">
                      Experience
                      {selectedExperience && (
                        <span className="ml-1 text-primary-600">(1)</span>
                      )}
                    </span>
                  </button>

                  {/* City */}
                  {cityOptions.length > 0 && (
                    <button
                      onClick={() => setSelectedMobileCategory("city")}
                      className={`w-full text-left px-4 py-4 border-b border-gray-200 transition-colors ${
                        selectedMobileCategory === "city"
                          ? "bg-white font-semibold"
                          : "bg-gray-100"
                      }`}
                    >
                      <span className="text-sm text-gray-900">
                        City
                        {selectedCities.length > 0 && (
                          <span className="ml-1 text-primary-600">
                            ({selectedCities.length})
                          </span>
                        )}
                      </span>
                    </button>
                  )}

                  {/* Work Mode */}
                  <button
                    onClick={() => setSelectedMobileCategory("workMode")}
                    className={`w-full text-left px-4 py-4 border-b border-gray-200 transition-colors ${
                      selectedMobileCategory === "workMode"
                        ? "bg-white font-semibold"
                        : "bg-gray-100"
                    }`}
                  >
                    <span className="text-sm text-gray-900">
                      Work Mode
                      {selectedWorkModes.length > 0 && (
                        <span className="ml-1 text-primary-600">
                          ({selectedWorkModes.length})
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right column - Filter Options */}
              <div className="flex-1 bg-white overflow-y-auto">
                {selectedMobileCategory === "roles" &&
                  roleOptions.length > 0 && (
                    <div className="space-y-0">
                      {roleOptions.map((role) => {
                        const label = role.name || role;
                        const active = selectedRoles.includes(label);
                        const jobCount = getJobCountForRoleName(label);
                        if (jobCount === 0) return null;
                        return (
                          <label
                            key={role.id || label}
                            className="flex items-center justify-between px-4 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm text-gray-900">
                              {label}
                            </span>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                toggleValue(label, setSelectedRoles)
                              }
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}

                {selectedMobileCategory === "salary" && (
                  <div className="space-y-0">
                    {SALARY_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center justify-between px-4 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-900">
                          {opt.label}
                        </span>
                        <input
                          type="radio"
                          name="mobile-salary"
                          value={opt.value}
                          checked={String(salaryFilter) === String(opt.value)}
                          onChange={(e) => setSalaryFilter(e.target.value)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {selectedMobileCategory === "jobType" && (
                  <div className="space-y-0">
                    {JOB_TYPE_OPTIONS.map((option) => {
                      const active = selectedJobTypes.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className="flex items-center justify-between px-4 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-900">
                            {option.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              toggleValue(option.value, setSelectedJobTypes)
                            }
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedMobileCategory === "experience" && (
                  <div className="space-y-0">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center justify-between px-4 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-900">
                          {opt.label}
                        </span>
                        <input
                          type="radio"
                          name="mobile-experience"
                          value={opt.value}
                          checked={selectedExperience === opt.value}
                          onChange={(e) =>
                            setSelectedExperience(e.target.value)
                          }
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {selectedMobileCategory === "city" &&
                  cityOptions.length > 0 && (
                    <div className="space-y-0">
                      {cityOptions.map((city) => {
                        const active = selectedCities.includes(city);
                        const jobCount = getJobCountForCity(city);
                        if (jobCount === 0) return null;
                        return (
                          <label
                            key={city}
                            className="flex items-center justify-between px-4 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm text-gray-900">
                              {city}
                            </span>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                toggleValue(city, setSelectedCities)
                              }
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}

                {selectedMobileCategory === "workMode" && (
                  <div className="space-y-0">
                    {WORK_MODE_OPTIONS.map((option) => {
                      const active = selectedWorkModes.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className="flex items-center justify-between px-4 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-900">
                            {option.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              toggleValue(option.value, setSelectedWorkModes)
                            }
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}

                {!selectedMobileCategory && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500">
                      Select a filter category
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMobileFilters(false);
                  // Filters are applied automatically via useEffect
                }}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <section className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 text-sm text-primary-600">{error}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
            <span>
              Showing {startIdx}–{endIdx} of {filteredWithoutSaved.length} roles
            </span>
            {hasSidebarFilters && (
              <span className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium">
                Filters applied
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-12 text-center">
                <div className="animate-pulse text-gray-600 text-sm">
                  Loading roles…
                </div>
              </div>
            </div>
          ) : paginated.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Jobs Found
                </h3>
                <p className="text-gray-600 text-sm">
                  No roles match these filters. Try adjusting your search
                  criteria.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((r) => (
                <article
                  key={r.id}
                  className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4 sm:p-6">
                    <button
                      onClick={() => toggleSaveJob(r.id, savedStatus[r.id])}
                      className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-primary-600 transition-colors z-10 p-1.5"
                      aria-label={savedStatus[r.id] ? "Unsave job" : "Save job"}
                    >
                      {savedStatus[r.id] ? (
                        <BookmarkCheck size={20} className="text-primary-600" />
                      ) : (
                        <Bookmark size={20} />
                      )}
                    </button>

                    {/* Mobile-optimized job card */}
                    <div className="flex flex-col gap-3 sm:gap-4 pr-10 sm:pr-8">
                      {/* Header with title and salary */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1.5 flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                            {r.title || "Untitled role"}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 text-sm text-gray-600">
                            {r.company && (
                              <span className="inline-flex items-center gap-1.5">
                                <Building2
                                  size={14}
                                  className="text-primary-500 flex-shrink-0"
                                />
                                <span className="truncate">{r.company}</span>
                              </span>
                            )}
                            {r.workMode === "Remote" ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Globe
                                  size={14}
                                  className="text-primary-500 flex-shrink-0"
                                />
                                Remote
                              </span>
                            ) : r.location ? (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin
                                  size={14}
                                  className="text-primary-500 flex-shrink-0"
                                />
                                <span className="truncate">{r.location}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Salary - more prominent on mobile */}
                        <div className="text-left sm:text-right">
                          {(r.minSalary != null ||
                            r.maxSalary != null ||
                            r.salary) && (
                            <p className="text-lg sm:text-xl font-semibold text-primary-600 sm:text-gray-900">
                              {formatSalary(r.salary, r.minSalary, r.maxSalary)}
                              <span className="text-sm font-normal text-gray-600">
                                /Month
                              </span>
                            </p>
                          )}
                          {r.vacancies && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              {r.vacancies} vacancies
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Job type badges - optimized for mobile */}
                      <div className="flex flex-wrap gap-2">
                        {r.type && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1 bg-primary-50 text-primary-700 rounded-lg text-xs sm:text-sm border border-primary-200">
                            <Briefcase
                              size={12}
                              className="sm:w-3.5 sm:h-3.5"
                            />
                            {r.type}
                          </span>
                        )}
                        {r.experience && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1 bg-purple-50 text-purple-700 rounded-lg text-xs sm:text-sm border border-purple-200">
                            <GraduationCap
                              size={12}
                              className="sm:w-3.5 sm:h-3.5"
                            />
                            {r.experience}
                          </span>
                        )}
                        {r.workMode && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-green-50 text-green-700 border border-slate-200 rounded-lg text-xs sm:text-sm">
                            {r.workMode === "Remote" && (
                              <Globe size={12} className="sm:w-3.5 sm:h-3.5" />
                            )}
                            {r.workMode === "Hybrid" && (
                              <Monitor
                                size={12}
                                className="sm:w-3.5 sm:h-3.5"
                              />
                            )}
                            {(r.workMode === "Office" ||
                              r.workMode === "On-site") && (
                              <Building
                                size={12}
                                className="sm:w-3.5 sm:h-3.5"
                              />
                            )}
                            {r.workMode}
                          </span>
                        )}
                      </div>

                      {/* Skills section - mobile optimized */}
                      <div className="flex flex-col gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {r.skills && r.skills.length > 0 && (
                            <>
                              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs sm:text-sm font-medium">
                                Skills
                              </span>
                              {r.skills.slice(0, 3).map((skill: any) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-gray-300 text-gray-600 bg-gray-50"
                                >
                                  {skill}
                                </span>
                              ))}
                              {r.skills.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-gray-500">
                                  +{r.skills.length - 3} more
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* View details button - full width on mobile */}
                        <button
                          onClick={() => router.push(`/jobs/${r.id}`)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-1.5 px-4 py-2.5 sm:py-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-200 hover:text-white rounded-lg transition-colors sm:bg-transparent sm:text-primary-600 sm:hover:text-primary-700 sm:p-0"
                        >
                          View details
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Mobile-optimized pagination */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 mt-6 sm:mt-8">
            {/* Mobile: Simple Previous/Next with page info */}
            <div className="flex sm:hidden w-full items-center justify-between gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <span className="text-sm text-gray-600 font-medium">
                Page {page} of {totalPages}
              </span>

              <button
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  page === totalPages || filteredWithoutSaved.length === 0
                }
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Desktop: Full pagination with page numbers */}
            <div className="hidden sm:flex justify-center items-center gap-2">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const active = page === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      active
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  page === totalPages || filteredWithoutSaved.length === 0
                }
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
