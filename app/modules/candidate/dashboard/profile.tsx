"use client";
import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { useToast } from "../../../components/toast";
import api from "../../../components/apiconfig/apiconfig";
import {
  citiesByState,
  stateOptions,
  countryOptions,
} from "../../../components/constants/locationData";
import {
  handleApiError,
  createErrorHandler,
} from "../../../components/utils/apiHelpers";

// Types
interface UserProfile {
  user_id?: string;
  id?: string | number;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  highest_qualification?: string;
  trade_stream?: string | string[];
  job_type?: string;
  availability?: string;
  expected_salary?: string;
  id_proof_available?: string;
  experience_years?: number | string;
  linkedin_url?: string;
  github_url?: string;
  resume_path?: string;
  [key: string]: any;
}

interface ApiResponse {
  success: boolean;
  user?: UserProfile;
  message?: string;
  error?: string;
  data?: any;
  resume_path?: string;
}

interface AuthResponse {
  ok: boolean;
  user?: {
    id?: string | number;
    sub?: string | number;
    name?: string;
    full_name?: string;
    email?: string;
    role?: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

interface FormData {
  user_id: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  city: string;
  state: string;
  country: string;
  highest_qualification: string;
  trade_stream: string;
  job_type: string;
  availability: string;
  expected_salary: string;
  id_proof_available: string;
  experience_years: string;
  linkedin_url: string;
  github_url: string;
  resume_path: string;
}

interface FieldErrors {
  [key: string]: string | undefined;
}

interface FieldTouched {
  [key: string]: boolean | undefined;
}

export default function ProfilePage() {
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleError = createErrorHandler(setError, setLoading);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fieldTouched, setFieldTouched] = useState<FieldTouched>({});

  const [form, setForm] = useState<FormData>({
    user_id: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    city: "",
    state: "",
    country: "India",
    highest_qualification: "",
    trade_stream: "",
    job_type: "Full-Time",
    availability: "Immediately",
    expected_salary: "",
    id_proof_available: "",
    experience_years: "0",
    linkedin_url: "",
    github_url: "",
    resume_path: "",
  });

  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(
    null,
  );

  const genderOptions: string[] = ["Select", "Male", "Female", "Other"];
  const qualificationOptions: string[] = [
    "Select",
    "10th Pass",
    "12th Pass",
    "ITI",
    "Diploma",
    "Graduate",
    "Student",
  ];

  interface TradesByQualification {
    [key: string]: string[];
  }

  const tradesByQualification: TradesByQualification = {
    "10th Pass": [
      "Select Trade/Stream",
      "Helper",
      "Delivery",
      "Security Guard",
      "Housekeeping",
      "Waiter",
      "Cook",
      "Driver",
      "Mason",
      "Painter",
      "Carpenter",
      "Mechanic",
      "Telecaller",
    ],
    "12th Pass": [
      "Select Trade/Stream",
      "Electrician",
      "Plumber",
      "Mechanic",
      "Carpenter",
      "Welder",
      "Painter",
      "Mason",
      "Driver",
      "Delivery",
      "Security Guard",
      "Housekeeping",
      "Cook",
      "Waiter",
      "Telecaller",
      "Data Entry",
    ],
    ITI: [
      "Select Trade/Stream",
      "Electrician",
      "Plumber",
      "Mechanic",
      "Welder",
      "Carpenter",
      "Fitter",
      "Turner",
      "Machinist",
      "Draughtsman",
      "Refrigeration Technician",
      "AC Technician",
      "Motor Mechanic",
      "Diesel Mechanic",
      "Auto Electrician",
    ],
    Diploma: [
      "Select Trade/Stream",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Computer Engineering",
      "Electronics Engineering",
      "Automobile Engineering",
      "Chemical Engineering",
      "Instrumentation Engineering",
      "IT Support",
      "Network Administrator",
      "Hardware Technician",
      "Software Developer",
      "Web Developer",
      "Mobile App Developer",
    ],
    Graduate: [
      "Select Trade/Stream",
      "Arts",
      "Science",
      "Commerce",
      "Engineering",
      "Computer / IT",
      "Management",
      "Medical",
      "Law",
      "Other",
    ],
    Student: [
      "Select Trade/Stream",
      "Arts",
      "Science",
      "Commerce",
      "Engineering",
      "Computer / IT",
      "Management",
      "Medical",
      "Law",
      "Other",
    ],
  };

  // Function to get relevant trades based on qualification
  function getTradesForQualification(qualification: string): string[] {
    return tradesByQualification[qualification] || ["Select Trade/Stream"];
  }

  // Salary ranges in INR
  const salaryOptions: string[] = [
    "Select Salary Range",
    "₹8,000–12,000",
    "₹12,000–18,000",
    "₹18,000–25,000",
    "₹25,000+",
  ];

  const jobTypeOptions: string[] = [
    "Full-Time",
    "Part-Time",
    "Internship",
    "Contract",
  ];
  const availabilityOptions: string[] = ["Immediately", "15 Days", "30 Days"];
  const idProofOptions: string[] = [
    "Select",
    "Aadhaar",
    "PAN",
    "Driving License",
    "None",
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  // Clear trade_stream when qualification doesn't require it
  useEffect(() => {
    const qualificationsThatNeedTrade = ["Diploma", "Graduate", "Student"];
    if (
      form.highest_qualification &&
      !qualificationsThatNeedTrade.includes(form.highest_qualification)
    ) {
      setForm((prev) => ({ ...prev, trade_stream: "" }));
    }
  }, [form.highest_qualification]);

  // Clear ID proof when qualification is not 10th Pass
  useEffect(() => {
    if (
      form.highest_qualification &&
      form.highest_qualification !== "10th Pass"
    ) {
      setForm((prev) => ({ ...prev, id_proof_available: "" }));
    }
  }, [form.highest_qualification]);

  // Clear LinkedIn URL when qualification is not Graduate, Student, or Diploma
  useEffect(() => {
    const allowedQualifications = ["Graduate", "Student", "Diploma"];
    if (
      form.highest_qualification &&
      !allowedQualifications.includes(form.highest_qualification)
    ) {
      setForm((prev) => ({ ...prev, linkedin_url: "" }));
    }
  }, [form.highest_qualification]);

  // Clear GitHub URL when qualification is not Graduate/Student/Diploma or trade stream is not IT-related
  useEffect(() => {
    const allowedQualifications = ["Graduate", "Student", "Diploma"];
    const isAllowedQualification = allowedQualifications.includes(
      form.highest_qualification,
    );
    const isITRelated =
      form.trade_stream &&
      (form.trade_stream.toLowerCase().includes("computer") ||
        form.trade_stream.toLowerCase().includes("it"));

    if (!isAllowedQualification || !isITRelated) {
      setForm((prev) => ({ ...prev, github_url: "" }));
    }
  }, [form.highest_qualification, form.trade_stream]);

  async function loadProfile(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse>("/profile/user");
      if (res?.data?.success && res.data.user) {
        setUser(res.data.user);
        setForm(mapUserToForm(res.data.user));
      }
    } catch (err) {
      handleError(err, "Failed to load profile. Please try again.");
    } finally {
      try {
        const auth = await api.get<AuthResponse>("/auth/session");
        const authUser = auth?.data?.user;
        if (authUser) {
          setForm((s) => ({
            ...s,
            user_id: s.user_id || String(authUser.id || authUser.sub || ""),
            full_name:
              s.full_name || authUser.name || authUser.full_name || s.full_name,
          }));
        }
      } catch (ignore) {}
      setLoading(false);
    }
  }

  function mapUserToForm(u: UserProfile): FormData {
    // Helper function to format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString?: string): string => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
    };

    return {
      user_id: u.user_id || String(u.id || ""),
      full_name: u.full_name || "",
      phone: u.phone || "",
      date_of_birth: formatDateForInput(u.date_of_birth),
      gender: u.gender || "",
      city: u.city || "",
      state: u.state || "",
      country: "India",
      highest_qualification: u.highest_qualification || "",
      trade_stream: Array.isArray(u.trade_stream)
        ? u.trade_stream.length > 0
          ? u.trade_stream[0]
          : ""
        : u.trade_stream || "",
      job_type: u.job_type || "",
      availability: u.availability || "",
      expected_salary: u.expected_salary || "",
      id_proof_available: u.id_proof_available || "",
      experience_years:
        u.experience_years !== undefined && u.experience_years !== null
          ? String(u.experience_years)
          : "",
      linkedin_url: u.linkedin_url || "",
      github_url: u.github_url || "",
      resume_path: u.resume_path || "",
    };
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));

    // Validate field if it has been touched
    if (fieldTouched[name]) {
      validateField(name, value);
    }
  }

  const validateUrl = (url: string, fieldName: string): string => {
    if (!url || !url.trim()) return ""; // URLs are optional
    const urlRegex =
      /^https?:\/\/[a-zA-Z0-9\-_\.]+(\.[a-zA-Z]{2,})+(\/[a-zA-Z0-9\-_\.\/\?\&\=\#\%\+]*)?$/;
    if (!urlRegex.test(url.trim())) {
      return `Please enter a valid ${fieldName} URL (e.g., https://linkedin.com/in/yourprofile)`;
    }
    return "";
  };

  const validateField = (name: string, value: string): void => {
    const errors = { ...fieldErrors };

    switch (name) {
      case "full_name":
        if (!value.trim()) {
          errors.full_name = "Full name is required";
        } else if (value.trim().length < 2) {
          errors.full_name = "Full name must be at least 2 characters";
        } else {
          delete errors.full_name;
        }
        break;

      case "phone":
        if (!value) {
          errors.phone = "Mobile number is required";
        } else if (!validatePhoneNumber(value)) {
          errors.phone = "Mobile number must be 10 digits starting with 6-9";
        } else {
          delete errors.phone;
        }
        break;

      case "date_of_birth":
        if (!value) {
          errors.date_of_birth = "Date of birth is required";
        } else if (!validateDateOfBirth(value)) {
          errors.date_of_birth = "You must be at least 18 years old";
        } else {
          delete errors.date_of_birth;
        }
        break;

      case "highest_qualification":
        if (!value) {
          errors.highest_qualification = "Highest qualification is required";
        } else {
          delete errors.highest_qualification;
        }
        break;

      case "experience_years":
        if (value === "") {
          errors.experience_years = "Please specify your experience";
        } else if (value !== "0" && !validateExperienceYears(value)) {
          errors.experience_years = "Experience must be 0-40 years";
        } else {
          delete errors.experience_years;
        }
        break;

      case "linkedin_url":
        const linkedinError = validateUrl(value, "LinkedIn");
        if (linkedinError) {
          errors.linkedin_url = linkedinError;
        } else {
          delete errors.linkedin_url;
        }
        break;

      case "github_url":
        const githubError = validateUrl(value, "GitHub");
        if (githubError) {
          errors.github_url = githubError;
        } else {
          delete errors.github_url;
        }
        break;

      default:
        if (errors[name]) {
          delete errors[name];
        }
    }

    setFieldErrors(errors);
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target;
    setFieldTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Get cities for selected state
  function getCitiesForState(state: string): string[] {
    return (citiesByState as Record<string, string[]>)[state] || [];
  }

  // Check if professional links should be shown
  function shouldShowProfessionalLinks(): boolean {
    // Show section if LinkedIn field should be shown OR GitHub field should be shown
    return shouldShowLinkedIn() || shouldShowGitHub();
  }

  // Check if LinkedIn field should be shown (for Graduate, Student, Diploma)
  function shouldShowLinkedIn(): boolean {
    return ["Graduate", "Student", "Diploma"].includes(
      form.highest_qualification,
    );
  }

  // Check if GitHub field should be shown (for Graduate, Student, Diploma with IT-related stream)
  function shouldShowGitHub(): boolean {
    const allowedQualifications = ["Graduate", "Student", "Diploma"];
    const isAllowedQualification = allowedQualifications.includes(
      form.highest_qualification,
    );
    let isITRelated = false;
    if (typeof form.trade_stream === "string") {
      isITRelated =
        form.trade_stream.toLowerCase().includes("computer") ||
        form.trade_stream.toLowerCase().includes("it");
    }
    return !!(isAllowedQualification && isITRelated);
  }

  // Check if experience years should be shown
  function shouldShowExperienceYears(): boolean {
    return form.experience_years !== "0" && form.experience_years !== "";
  }

  // Check if documents section should be shown
  function shouldShowDocumentsSection(): boolean {
    const hasPersonalInfo =
      form.full_name && form.phone && form.date_of_birth && form.gender;
    const hasLocation = form.city && form.state && form.country;
    const hasEducation = form.highest_qualification;
    return !!(hasPersonalInfo && hasLocation && hasEducation);
  }

  // Validation functions
  function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  function validateExperienceYears(years: string): boolean {
    const num = parseInt(years);
    return !isNaN(num) && num >= 0 && num <= 40;
  }

  function validateDateOfBirth(dob: string): boolean {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }

  function validateForm(): string[] {
    const errors: string[] = [];

    // Phone validation
    if (!form.phone || !validatePhoneNumber(form.phone)) {
      errors.push("Mobile number must be exactly 10 digits and start with 6-9");
    }

    // Date of birth validation
    if (!form.date_of_birth || !validateDateOfBirth(form.date_of_birth)) {
      errors.push(
        "Date of birth is required and must be for someone 18 years or older",
      );
    }

    // Experience years validation
    if (form.experience_years === "") {
      // If experience_years is empty string, it means user selected "No, I have experience" but didn't enter years
      errors.push("Please enter your years of experience");
    } else if (
      form.experience_years !== "0" &&
      !validateExperienceYears(form.experience_years)
    ) {
      errors.push("Experience years must be an integer between 1 and 40");
    }

    // ID proof validation - required for 10th Pass, 12th Pass, and ITI qualifications
    if (
      ["10th Pass", "12th Pass", "ITI"].includes(form.highest_qualification) &&
      !form.id_proof_available
    ) {
      errors.push("ID proof is required for 10th pass qualification");
    }

    return errors;
  }

  // Section completion checkers
  function isPersonalInfoComplete(): boolean {
    return !!(
      form.full_name &&
      validatePhoneNumber(form.phone) &&
      form.date_of_birth &&
      form.gender
    );
  }

  function isLocationComplete(): boolean {
    return !!(form.state && form.city && form.country);
  }

  function isEducationComplete(): boolean {
    return !!form.highest_qualification;
  }

  function isExperienceComplete(): boolean {
    // If fresher (experience_years === "0"), section is complete
    if (form.experience_years === "0") return true;
    // If has experience but no years entered, not complete
    if (form.experience_years === "") return false;
    // If has experience and years entered, validate the years
    return validateExperienceYears(form.experience_years);
  }

  function isJobPreferencesComplete(): boolean {
    return !!(form.job_type && form.availability);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0] || null;

    if (file && !file.name.toLowerCase().endsWith(".pdf")) {
      showError(
        "Please select a PDF file only. Other formats are not accepted.",
      );
      return;
    }

    setSelectedResumeFile(file);
    setForm((s) => ({
      ...s,
      resume_path: file ? `${file.name}` : s.resume_path,
    }));
  }

  async function uploadResume(file: File | null): Promise<string | null> {
    return file ? file.name : null;
  }

  interface SavePayload {
    user_id?: string;
    full_name?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string;
    highest_qualification?: string | null;
    trade_stream?: string | null;
    job_type?: string | null;
    availability?: string | null;
    expected_salary?: string | null;
    id_proof_available?: string | null;
    experience_years?: number | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    resume_path?: string;
  }

  async function handleSave(
    e?: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e?.preventDefault();
    setSaving(true);
    setError(null);

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showError(validationErrors.join(". "));
      setSaving(false);
      return;
    }

    try {
      let payloadUserId = form.user_id;
      if (!payloadUserId) {
        try {
          const auth = await api.get<AuthResponse>("/auth/session");
          const authUser = auth?.data?.user;
          if (authUser) {
            payloadUserId = String(
              authUser.id || authUser.sub || payloadUserId,
            );
            setForm((s) => ({ ...s, user_id: payloadUserId }));
          } else {
            showError(
              "Cannot save profile: missing user session. Please sign in again.",
            );
            setSaving(false);
            return;
          }
        } catch (err) {
          showError(
            "Cannot save profile: missing user session. Please sign in again.",
          );
          setSaving(false);
          return;
        }
      }

      // Resume upload is optional
      let resumePathToSend: string | null = null;

      if (selectedResumeFile) {
        // User uploaded a resume - send it to be renamed to <user_id>.pdf
        resumePathToSend = `/uploads/resumes/${payloadUserId}.pdf`;

        try {
          const formData = new FormData();
          formData.append("resume", selectedResumeFile);
          formData.append("user_id", payloadUserId);

          const uploadRes = await api.post<ApiResponse>(
            "/profile/upload-resume",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            },
          );

          if (uploadRes?.data?.success) {
            resumePathToSend = uploadRes.data.resume_path ?? resumePathToSend;
          } else {
            showError("Failed to upload resume file");
            setSaving(false);
            return;
          }
        } catch (err) {
          showError("Failed to upload resume file");
          setSaving(false);
          return;
        }
      }

      const toNullIfEmpty = (value: any): string | null => {
        if (value === undefined || value === null || value === "") return null;
        return value;
      };

      const payload: SavePayload = {
        user_id: payloadUserId || undefined,
        full_name: form.full_name || null,
        phone: toNullIfEmpty(form.phone),
        date_of_birth: toNullIfEmpty(form.date_of_birth),
        gender: toNullIfEmpty(form.gender),
        city: toNullIfEmpty(form.city),
        state: toNullIfEmpty(form.state),
        country: "India",
        highest_qualification: toNullIfEmpty(form.highest_qualification),
        trade_stream: toNullIfEmpty(form.trade_stream),
        job_type: toNullIfEmpty(form.job_type),
        availability: toNullIfEmpty(form.availability),
        expected_salary: toNullIfEmpty(form.expected_salary),
        id_proof_available: toNullIfEmpty(form.id_proof_available),
        experience_years:
          form.experience_years && form.experience_years !== ""
            ? parseFloat(form.experience_years)
            : null,
        linkedin_url: toNullIfEmpty(form.linkedin_url),
        github_url: toNullIfEmpty(form.github_url),
      };

      // Only include resume_path if a new resume was uploaded
      if (resumePathToSend) {
        payload.resume_path = resumePathToSend;
      }

      const res = await api.put<ApiResponse>("/profile/user", payload);

      if (res?.data?.success) {
        // Convert nulls to undefined for UserProfile compatibility
        const normalizeUserProfile = (obj: any): UserProfile => {
          const result: UserProfile = {};
          Object.keys(obj).forEach((key) => {
            result[key] = obj[key] === null ? undefined : obj[key];
          });
          return result;
        };
        const userProfile = res.data.user
          ? res.data.user
          : normalizeUserProfile(payload);
        setUser(userProfile);
        setForm(mapUserToForm(userProfile));
        setIsEditing(false);
        setSelectedResumeFile(null);

        const applyJobId = localStorage.getItem("postLoginApplyJobId");
        const redirectPath = localStorage.getItem("postLoginRedirect");

        if (applyJobId && redirectPath) {
          localStorage.removeItem("postLoginApplyJobId");
          localStorage.removeItem("postLoginRedirect");
          showSuccess(
            "Profile saved successfully! You can now apply for the job.",
          );
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 1500);
          return;
        } else {
          showSuccess("Profile saved successfully!");
        }
      } else {
        const errorMsg =
          res?.data?.message || res?.data?.error || "Unknown server response";
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = handleApiError(err, "Failed to save profile");
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  function handleEditClick(): void {
    setIsEditing(true);
    if (user) setForm(mapUserToForm(user));
  }

  function handleCancel(): void {
    setIsEditing(false);
    if (user) setForm(mapUserToForm(user));
    setSelectedResumeFile(null);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your professional information
            </p>
          </div>
          {!isEditing && user && (
            <button
              onClick={handleEditClick}
              className="btn btn-primary px-4 py-2 inline-flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing ? (
          <ProfileView user={user} onEdit={handleEditClick} />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <User size={20} />
                  Personal Information
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="Enter your full name"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          fieldErrors.full_name
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.full_name && fieldTouched.full_name && (
                        <p className="text-red-600 text-xs mt-1">
                          {fieldErrors.full_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                          if (value.length <= 10) {
                            handleChange({
                              target: { name: "phone", value },
                            } as React.ChangeEvent<HTMLInputElement>);
                          }
                        }}
                        onBlur={handleBlur}
                        required
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          fieldErrors.phone
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.phone && fieldTouched.phone ? (
                        <p className="text-red-600 text-xs mt-1">
                          {fieldErrors.phone}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Enter 10-digit mobile number starting with 6-9
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Date of Birth *
                      </label>
                      <input
                        name="date_of_birth"
                        type="date"
                        value={form.date_of_birth}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        max={
                          new Date(
                            Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000,
                          )
                            .toISOString()
                            .split("T")[0]
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          fieldErrors.date_of_birth
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.date_of_birth &&
                      fieldTouched.date_of_birth ? (
                        <p className="text-red-600 text-xs mt-1">
                          {fieldErrors.date_of_birth}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Must be 18 years or older
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        {genderOptions.map((opt) => (
                          <option key={opt} value={opt === "Select" ? "" : opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin size={20} />
                  Location
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      State *
                    </label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      {stateOptions.map((state: string) => (
                        <option
                          key={state}
                          value={state === "Select State" ? "" : state}
                        >
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      City *
                    </label>
                    <select
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="">Select City</option>
                      {getCitiesForState(form.state).map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={form.country}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    >
                      {countryOptions.map((country: string) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Education & Skills */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <GraduationCap size={20} />
                  Education & Skills
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Highest Qualification *
                    </label>
                    <select
                      name="highest_qualification"
                      value={form.highest_qualification}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      {qualificationOptions.map((opt) => (
                        <option key={opt} value={opt === "Select" ? "" : opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  {["Diploma", "Graduate", "Student"].includes(
                    form.highest_qualification,
                  ) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Trade / Stream
                      </label>
                      <select
                        name="trade_stream"
                        value={form.trade_stream}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="">Select Trade/Stream</option>
                        {getTradesForQualification(form.highest_qualification)
                          .filter((trade) => trade !== "Select Trade/Stream")
                          .map((trade) => (
                            <option key={trade} value={trade}>
                              {trade}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Briefcase size={20} />
                  Experience
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Are you a Fresher?
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, experience_years: "0" }))
                      }
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                        form.experience_years === "0"
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Yes, I'm a Fresher
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, experience_years: "" }))
                      }
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                        form.experience_years !== "0"
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      No, I have experience
                    </button>
                  </div>
                </div>

                {form.experience_years !== "0" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Experience Years *
                      </label>
                      <input
                        name="experience_years"
                        type="number"
                        step="1"
                        min="1"
                        max="40"
                        value={
                          form.experience_years === ""
                            ? ""
                            : form.experience_years
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value === "" ||
                            (parseInt(value) >= 1 && parseInt(value) <= 40)
                          ) {
                            handleChange(e);
                          }
                        }}
                        required
                        placeholder="e.g., 2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  Job Preferences
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Job Type *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {jobTypeOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, job_type: option }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            form.job_type === option
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Availability *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availabilityOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              availability: option,
                            }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            form.availability === option
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Expected Salary
                    </label>
                    <select
                      name="expected_salary"
                      value={form.expected_salary}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      {salaryOptions.map((salary) => (
                        <option
                          key={salary}
                          value={salary === "Select Salary Range" ? "" : salary}
                        >
                          {salary}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            {shouldShowDocumentsSection() && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <FileText size={20} />
                    Documents
                  </h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume Upload (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-primary-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedResumeFile
                                ? selectedResumeFile.name
                                : form.resume_path
                                  ? "Resume uploaded"
                                  : "No resume selected"}
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF files only, up to 10MB
                            </p>
                          </div>
                        </div>
                        <label className="cursor-pointer">
                          <span className="btn btn-primary btn-sm">
                            Choose PDF
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {selectedResumeFile &&
                        !selectedResumeFile.name
                          .toLowerCase()
                          .endsWith(".pdf") && (
                          <p className="text-xs text-primary-600 mt-2">
                            Please select a PDF file only
                          </p>
                        )}
                    </div>
                  </div>

                  {["10th Pass", "12th Pass", "ITI"].includes(
                    form.highest_qualification,
                  ) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        ID Proof Available *
                      </label>
                      <select
                        name="id_proof_available"
                        value={form.id_proof_available}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        {idProofOptions.map((opt) => (
                          <option key={opt} value={opt === "Select" ? "" : opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Professional Links */}
            {shouldShowProfessionalLinks() && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Professional Links
                  </h3>
                </div>
                <div className="p-6">
                  <div
                    className={`grid grid-cols-1 ${shouldShowLinkedIn() && shouldShowGitHub() ? "md:grid-cols-2" : ""} gap-4`}
                  >
                    {shouldShowLinkedIn() && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          LinkedIn URL
                        </label>
                        <input
                          name="linkedin_url"
                          value={form.linkedin_url}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="https://linkedin.com/in/yourprofile"
                          type="url"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors ${
                            fieldErrors.linkedin_url &&
                            fieldTouched.linkedin_url
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-primary-500"
                          }`}
                        />
                        {fieldErrors.linkedin_url &&
                          fieldTouched.linkedin_url && (
                            <p className="text-red-600 text-xs mt-1">
                              {fieldErrors.linkedin_url}
                            </p>
                          )}
                      </div>
                    )}
                    {shouldShowGitHub() && (
                      <div
                        className={
                          shouldShowLinkedIn() && shouldShowGitHub()
                            ? ""
                            : "md:col-span-2"
                        }
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          GitHub URL
                        </label>
                        <input
                          name="github_url"
                          value={form.github_url}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="https://github.com/yourusername"
                          type="url"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors ${
                            fieldErrors.github_url && fieldTouched.github_url
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-primary-500"
                          }`}
                        />
                        {fieldErrors.github_url && fieldTouched.github_url && (
                          <p className="text-red-600 text-xs mt-1">
                            {fieldErrors.github_url}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ProfileView Component
interface ProfileViewProps {
  user: UserProfile | null;
  onEdit: () => void;
}

function ProfileView({ user, onEdit }: ProfileViewProps) {
  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Profile Found
          </h3>
          <p className="text-gray-600 mb-6">
            Create your professional profile to get started
          </p>
          <button onClick={onEdit} className="btn btn-primary p-2">
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-lg">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.full_name}
              </h2>
              <p className="text-gray-600">
                {user.highest_qualification || "Add education"}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span>{user.experience_years ?? 0} years experience</span>
                <span>•</span>
                <span>{user.phone || "No phone"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <User size={20} />
              Personal Information
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <InfoItem label="Full Name" value={user.full_name} />
              <InfoItem label="Mobile" value={user.phone} />
              <InfoItem
                label="Date of Birth"
                value={
                  user.date_of_birth
                    ? new Date(user.date_of_birth).toLocaleDateString("en-GB")
                    : "—"
                }
              />
              <InfoItem label="Gender" value={user.gender} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MapPin size={20} />
              Location
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <InfoItem label="City" value={user.city} />
              <InfoItem label="State" value={user.state} />
              <InfoItem label="Country" value={user.country} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <GraduationCap size={20} />
              Education & Skills
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <InfoItem
                label="Qualification"
                value={user.highest_qualification}
              />
              {["Diploma", "Graduate", "Student"].includes(
                user.highest_qualification || "",
              ) && (
                <InfoItem
                  label="Trade/Stream"
                  value={
                    Array.isArray(user.trade_stream)
                      ? user.trade_stream[0]
                      : user.trade_stream
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase size={20} />
              Job Preferences
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <InfoItem
                label="Experience Years"
                value={
                  user.experience_years !== undefined &&
                  user.experience_years !== null
                    ? `${user.experience_years} years`
                    : "—"
                }
              />
              <InfoItem label="Job Type" value={user.job_type} />
              <InfoItem label="Expected Salary" value={user.expected_salary} />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Links */}
      {(() => {
        const shouldShowLinkedIn =
          user.highest_qualification === "Graduate" && user.linkedin_url;
        const shouldShowGitHub =
          user.highest_qualification === "Graduate" &&
          user.trade_stream &&
          typeof user.trade_stream === "string" &&
          (user.trade_stream.toLowerCase().includes("computer") ||
            user.trade_stream.toLowerCase().includes("it")) &&
          user.github_url;

        return shouldShowLinkedIn || shouldShowGitHub ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">
                Professional Links
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {shouldShowLinkedIn && (
                  <LinkItem label="LinkedIn" url={user.linkedin_url || ""} />
                )}
                {shouldShowGitHub && (
                  <LinkItem label="GitHub" url={user.github_url || ""} />
                )}
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Resume */}
      {user.resume_path &&
        (() => {
          let resumeUrl = user.resume_path || "";
          if (!resumeUrl.startsWith("http")) {
            // Get API base URL and construct server base URL
            const apiBase =
              process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";
            // Extract server base: remove /api if present, or use as-is
            let serverBase = apiBase;
            if (apiBase.endsWith("/api")) {
              serverBase = apiBase.slice(0, -4); // Remove '/api'
            } else if (apiBase.includes("/api/")) {
              serverBase = apiBase.split("/api")[0]; // Get part before '/api'
            }
            // Ensure serverBase doesn't end with slash
            serverBase = serverBase.replace(/\/$/, "");
            // Normalize resume path
            const resumePath = resumeUrl.startsWith("/")
              ? resumeUrl
              : `/${resumeUrl}`;
            resumeUrl = `${serverBase}${resumePath}`;
          }

          return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-blue-700 font-medium"
                >
                  <FileText size={18} />
                  View Resume
                </a>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// InfoItem Component
interface InfoItemProps {
  label: string;
  value?: string | number | null;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
    </div>
  );
}

// LinkItem Component
interface LinkItemProps {
  label: string;
  url: string;
}

function LinkItem({ label, url }: LinkItemProps) {
  if (!url) return null;

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-primary-600 hover:text-blue-700 font-medium truncate max-w-xs"
      >
        {url}
      </a>
    </div>
  );
}
