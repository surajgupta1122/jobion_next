"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import api from "@/app/components/apiconfig/apiconfig.jsx";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { useToast } from "@/app/components/toast";
import ROLE_AUTO_FILL_DATA from "@/app/constants/role_auto_fill_data";
import {
  citiesByState,
  stateOptions as STATE_OPTIONS,
} from "@/app/constants/locationData";

type Role = { id: number; name: string };

type FiltersResponse = {
  ok: boolean;
  filters?: {
    roles?: Role[];
  };
};

type FormState = {
  role_id: string;
  role_name: string;
  company: string;
  job_type: string;
  work_mode: string;

  country: string;
  state: string;
  city: string;
  locality: string;
  vacancies: string;

  min_experience: string;
  max_experience: string;
  min_salary: string;
  max_salary: string;

  description: string;
  skills: string;

  interview_address: string;
  contact_email: string;
  contact_phone: string;

  show_interview_address: boolean;
  show_contact_phone: boolean;
};

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Work from Home",
];
const WORK_MODES = ["Office", "Remote", "Hybrid"];

type FormErrors = Partial<Record<keyof FormState, string>> & {
  _form?: string;
};

type RecruiterDefaults = Pick<
  FormState,
  | "company"
  | "country"
  | "state"
  | "city"
  | "interview_address"
  | "contact_email"
  | "contact_phone"
>;

export default function CreateJob() {
  const { showError, showSuccess } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [autofilled, setAutofilled] = useState<Set<keyof FormState>>(
    () => new Set(),
  );

  const [recruiterDefaults, setRecruiterDefaults] = useState<RecruiterDefaults>(
    () => ({
      company: "",
      country: "India",
      state: "",
      city: "",
      interview_address: "",
      contact_email: "",
      contact_phone: "",
    }),
  );

  const [form, setForm] = useState<FormState>({
    role_id: "",
    role_name: "",
    company: "",
    job_type: "Full-time",
    work_mode: "Office",

    country: "India",
    state: "",
    city: "",
    locality: "",
    vacancies: "1",

    min_experience: "0",
    max_experience: "0",
    min_salary: "",
    max_salary: "",

    description: "",
    skills: "",

    interview_address: "",
    contact_email: "",
    contact_phone: "",

    show_interview_address: true,
    show_contact_phone: true,
  });

  const getTemplateForRoleName = useCallback((roleName: string) => {
    const key = String(roleName || "").trim();
    const template = (ROLE_AUTO_FILL_DATA as any)?.[key];
    return template || null;
  }, []);

  const validate = useCallback(
    (s: FormState): FormErrors => {
      const errors: FormErrors = {};

      if (!s.role_id) errors.role_id = "Please select a job role.";
      if (!String(s.company || "").trim()) errors.company = "Company is required.";

      const description = String(s.description || "").trim();
      if (!description) errors.description = "Job description is required.";
      else if (description.length < 50) {
        errors.description = "Job description must be at least 50 characters.";
      }

      const workMode = String(s.work_mode || "");
      const state = String(s.state || "").trim();
      const city = String(s.city || "").trim();
      if (workMode !== "Remote") {
        if (!state) errors.state = "State is required for Office/Hybrid jobs.";
        if (!city) errors.city = "City is required for Office/Hybrid jobs.";
      }

      const vacancies = Number(s.vacancies);
      if (!Number.isFinite(vacancies) || vacancies < 1) {
        errors.vacancies = "Number of openings must be at least 1.";
      }

      const minExp = Number(s.min_experience);
      const maxExp = Number(s.max_experience);
      if (
        Number.isFinite(minExp) &&
        Number.isFinite(maxExp) &&
        minExp > maxExp
      ) {
        errors.max_experience = "Max experience must be ≥ min experience.";
      }

      const minSalary =
        s.min_salary === "" || s.min_salary === null ? null : Number(s.min_salary);
      const maxSalary =
        s.max_salary === "" || s.max_salary === null ? null : Number(s.max_salary);
      if (
        minSalary !== null &&
        maxSalary !== null &&
        Number.isFinite(minSalary) &&
        Number.isFinite(maxSalary) &&
        minSalary > maxSalary
      ) {
        errors.max_salary = "Max salary must be ≥ min salary.";
      }

      const email = String(s.contact_email || "").trim();
      const phone = String(s.contact_phone || "").trim();
      if (!email && !phone) {
        errors._form = "Please provide at least one contact: email or phone.";
      }
      if (email) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!ok) errors.contact_email = "Please enter a valid email address.";
      }
      if (phone) {
        const ok = /^[6-9]\d{9}$/.test(phone);
        if (!ok) errors.contact_phone = "Please enter a valid 10-digit Indian mobile number.";
      }

      return errors;
    },
    [],
  );

  const errors = useMemo(() => validate(form), [form, validate]);

  useEffect(() => {
    let mounted = true;
    async function loadRoles() {
      try {
        setLoadingRoles(true);
        const { data } = await api.get<FiltersResponse>("/jobs/filters");
        const r = data?.filters?.roles || [];
        if (mounted) setRoles(r);
      } catch {
        if (mounted) setRoles([]);
      } finally {
        if (mounted) setLoadingRoles(false);
      }
    }
    loadRoles();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [profileRes, sessionRes] = await Promise.allSettled([
          api.get("/recruiter-profile/recruiter"),
          api.get("/auth/session"),
        ]);

        const recruiter =
          profileRes.status === "fulfilled"
            ? profileRes.value?.data?.recruiter
            : null;
        const sessionUser =
          sessionRes.status === "fulfilled" ? sessionRes.value?.data?.user : null;

        const defaults: RecruiterDefaults = {
          company:
            recruiter?.company_name ||
            recruiter?.companyName ||
            recruiter?.company ||
            "",
          country: recruiter?.country || "India",
          state: recruiter?.state || "",
          city: recruiter?.city || "",
          interview_address: [recruiter?.address_line_1, recruiter?.address_line_2]
            .filter(Boolean)
            .join(", "),
          contact_email:
            sessionUser?.email ||
            recruiter?.email ||
            recruiter?.contact_email ||
            "",
          contact_phone:
            recruiter?.hr_mobile ||
            recruiter?.hrMobile ||
            recruiter?.contact_phone ||
            "",
        };

        if (!mounted) return;
        setRecruiterDefaults(defaults);
        setForm((s) => ({
          ...s,
          company: s.company || defaults.company,
          country: defaults.country || "India",
          state: s.state || defaults.state,
          city: s.city || defaults.city,
          interview_address: s.interview_address || defaults.interview_address,
          contact_email: s.contact_email || defaults.contact_email,
          contact_phone: s.contact_phone || defaults.contact_phone,
        }));
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return Object.keys(errors).length === 0 && !submitting;
  }, [errors, submitting]);

  const setField = useCallback(
    (k: keyof FormState, v: any, { clearAutofill = true } = {}) => {
      setSuccess(null);
      setError(null);
      setForm((s) => ({ ...s, [k]: v }));
      if (clearAutofill) {
        setAutofilled((prev) => {
          if (!prev.has(k)) return prev;
          const next = new Set(prev);
          next.delete(k);
          return next;
        });
      }
    },
    [],
  );

  const onChange = (k: keyof FormState) => (e: any) => {
    const v =
      e?.target?.type === "checkbox" ? !!e.target.checked : e?.target?.value;
    setField(k, v);
  };

  const applyRoleTemplate = useCallback(
    (roleName: string) => {
      const t = getTemplateForRoleName(roleName);
      if (!t) {
        setAutofilled(new Set());
        return;
      }

      const patch: Partial<FormState> = {
        description: String(t.description || ""),
        skills: String(t.skills || ""),
        min_experience: String(t.minExperience ?? ""),
        max_experience: String(t.maxExperience ?? ""),
        min_salary: String(t.minSalary ?? ""),
        max_salary: String(t.maxSalary ?? ""),
        job_type: String(t.jobType || form.job_type),
        work_mode: String(t.workMode || form.work_mode),
        vacancies: String(t.vacancies ?? form.vacancies),
      };

      const filledKeys: (keyof FormState)[] = [
        "description",
        "skills",
        "min_experience",
        "max_experience",
        "min_salary",
        "max_salary",
        "job_type",
        "work_mode",
        "vacancies",
      ];

      setForm((s) => ({ ...s, ...patch }));
      setAutofilled(new Set(filledKeys));
    },
    [form.job_type, form.vacancies, form.work_mode, getTemplateForRoleName],
  );

  const onPickRole = useCallback(
    (r: Role | null) => {
      setSuccess(null);
      setError(null);
      setAttemptedSubmit(false);
      setAutofilled(new Set());
      setForm((s) => ({
        ...s,
        role_id: r ? String(r.id) : "",
        role_name: r ? r.name : "",
      }));
      if (r?.name) applyRoleTemplate(r.name);
    },
    [applyRoleTemplate],
  );

  const resetToDefaults = useCallback(() => {
    setAttemptedSubmit(false);
    setAutofilled(new Set());
    setError(null);
    setSuccess(null);
    setForm((s) => ({
      ...s,
      role_id: "",
      role_name: "",
      job_type: "Full-time",
      work_mode: "Office",
      locality: "",
      vacancies: "1",
      min_experience: "0",
      max_experience: "0",
      min_salary: "",
      max_salary: "",
      description: "",
      skills: "",
      show_interview_address: true,
      show_contact_phone: true,
      // keep recruiter defaults
      company: recruiterDefaults.company,
      country: recruiterDefaults.country || "India",
      state: recruiterDefaults.state,
      city: recruiterDefaults.city,
      interview_address: recruiterDefaults.interview_address,
      contact_email: recruiterDefaults.contact_email,
      contact_phone: recruiterDefaults.contact_phone,
    }));
  }, [recruiterDefaults]);

  const submit = async () => {
    try {
      setAttemptedSubmit(true);
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const e = validate(form);
      if (Object.keys(e).length > 0) {
        const msg = e._form || "Please fix the highlighted fields and try again.";
        showError(msg);
        setError(msg);
        return;
      }

      const payload = {
        ...form,
        role_name: undefined,
        role_id: Number(form.role_id),
        vacancies: Number(form.vacancies || 0),
        min_experience: Number(form.min_experience || 0),
        max_experience: Number(form.max_experience || 0),
        min_salary: form.min_salary ? Number(form.min_salary) : null,
        max_salary: form.max_salary ? Number(form.max_salary) : null,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(toTitleCase),
      };

      const { data } = await api.post("/recruiter/jobs", payload);
      if (!data?.ok) throw new Error(data?.message || "Failed to create job");
      setSuccess("Job created successfully and sent for approval.");
      showSuccess("Job published. Sent for admin approval.");
      resetToDefaults();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to create job";
      setError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
        <h1 className="text-xl font-bold text-slate-900">Post a New Job</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the details below to create a job posting
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}
      {attemptedSubmit && errors._form && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {errors._form}
        </div>
      )}

      <div className="space-y-5">
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Job Role *">
              <RoleCombobox
                value={form.role_id ? { id: Number(form.role_id), name: form.role_name } : null}
                roles={roles}
                loading={loadingRoles}
                onPick={onPickRole}
                hasError={attemptedSubmit && !!errors.role_id}
              />
              <div className="text-xs text-slate-400 mt-1">
                Selecting a role will auto-fill related fields
              </div>
              {attemptedSubmit && errors.role_id && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.role_id}
                </div>
              )}
            </Field>

            <Field label="Company *">
              <input
                value={form.company}
                readOnly
                disabled
                placeholder="Company name"
                className={cls(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  attemptedSubmit && errors.company
                    ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 focus:ring-slate-100",
                )}
              />
              {attemptedSubmit && errors.company && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.company}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-1">
              <Field label="Job Type">
                <Select
                  value={form.job_type}
                  onChange={onChange("job_type")}
                  options={JOB_TYPES}
                  auto={autofilled.has("job_type")}
                />
              </Field>
              <Field label="Work Mode">
                <Select
                  value={form.work_mode}
                  onChange={(e: any) => {
                    const next = e?.target?.value;
                    setField("work_mode", next);
                    if (next === "Remote") {
                      // city becomes optional; keep user selection but clear errors via re-validate
                      return;
                    }
                  }}
                  options={WORK_MODES}
                  auto={autofilled.has("work_mode")}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Location & Openings">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Country">
              <input
                value={form.country}
                readOnly
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label={form.work_mode === "Remote" ? "State" : "State *"}>
              <div className="relative">
                <select
                  value={form.state}
                  onChange={(e) => {
                    const next = e.target.value;
                    setField("state", next);
                    // clear city when state changes (unless remote + user is typing city)
                    setField("city", "", { clearAutofill: true });
                  }}
                  className={cls(
                    "w-full appearance-none rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                    attemptedSubmit && errors.state
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                  )}
                >
                  <option value="">Select State</option>
                  {STATE_OPTIONS.filter((s) => s !== "Select State").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
              {attemptedSubmit && errors.state && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.state}
                </div>
              )}
            </Field>
            <Field label={form.work_mode === "Remote" ? "City (optional)" : "City *"}>
              {form.work_mode === "Remote" && !form.state ? (
                <input
                  value={form.city}
                  onChange={onChange("city")}
                  placeholder="City (optional for Remote)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
                />
              ) : (
                <div className="relative">
                  <select
                    value={form.city}
                    onChange={onChange("city")}
                    disabled={!form.state}
                    className={cls(
                      "w-full appearance-none rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4 disabled:cursor-not-allowed",
                      !form.state
                        ? "border-slate-200 bg-slate-50 text-slate-500 focus:ring-slate-100"
                        : attemptedSubmit && errors.city
                          ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                          : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                    )}
                  >
                    <option value="">
                      {!form.state ? "Select state first" : "Select City"}
                    </option>
                    {(citiesByState as any)?.[form.state]?.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              )}
              {attemptedSubmit && errors.city && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.city}
                </div>
              )}
            </Field>
            <Field label="Locality / area">
              <input
                value={form.locality}
                onChange={onChange("locality")}
                placeholder="Enter locality (optional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Number of openings">
              <input
                value={form.vacancies}
                onChange={onChange("vacancies")}
                type="number"
                min={1}
                className={cls(
                  "w-full max-w-xs rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("vacancies")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : attemptedSubmit && errors.vacancies
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
              {attemptedSubmit && errors.vacancies && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.vacancies}
                </div>
              )}
            </Field>
          </div>
        </Section>

        <Section title="Experience & Compensation">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Min Experience (Yrs)">
              <input
                value={form.min_experience}
                onChange={onChange("min_experience")}
                type="number"
                min={0}
                className={cls(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("min_experience")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
            </Field>
            <Field label="Max Experience (Yrs)">
              <input
                value={form.max_experience}
                onChange={onChange("max_experience")}
                type="number"
                min={0}
                className={cls(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("max_experience")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : attemptedSubmit && errors.max_experience
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
              {attemptedSubmit && errors.max_experience && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.max_experience}
                </div>
              )}
            </Field>
            <Field label="Min Salary / Month">
              <input
                value={form.min_salary}
                onChange={onChange("min_salary")}
                type="number"
                min={0}
                className={cls(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("min_salary")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
            </Field>
            <Field label="Max Salary / Month">
              <input
                value={form.max_salary}
                onChange={onChange("max_salary")}
                type="number"
                min={0}
                className={cls(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("max_salary")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : attemptedSubmit && errors.max_salary
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
              {attemptedSubmit && errors.max_salary && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.max_salary}
                </div>
              )}
            </Field>
          </div>
        </Section>

        <Section title="Job Details">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Job Description *">
              <textarea
                value={form.description}
                onChange={onChange("description")}
                placeholder="Enter job responsibilities, requirements, benefits, and other details..."
                className={cls(
                  "w-full min-h-[160px] rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("description")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : attemptedSubmit && errors.description
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Minimum 50 characters</span>
                <span>{String(form.description || "").trim().length}/50</span>
              </div>
              {attemptedSubmit && errors.description && (
                <div className="text-xs text-red-600 mt-1 font-semibold">
                  {errors.description}
                </div>
              )}
            </Field>
            <Field label="Skills & Technologies">
              <input
                value={form.skills}
                onChange={onChange("skills")}
                placeholder="Enter skills separated by commas (e.g. React, Node.js, SQL)"
                className={cls(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                  autofilled.has("skills")
                    ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
                    : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                )}
              />
            </Field>
          </div>
        </Section>

        <Section title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Interview / Office Address"
              right={
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <input
                    type="checkbox"
                    checked={form.show_interview_address}
                    onChange={onChange("show_interview_address")}
                  />
                  Show to Candidates
                </label>
              }
            >
              <input
                value={form.interview_address}
                onChange={onChange("interview_address")}
                placeholder="Enter address"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4">
              <Field label="Contact Email">
                <input
                  value={form.contact_email}
                  onChange={onChange("contact_email")}
                  placeholder="contact@company.com"
                  className={cls(
                    "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                    attemptedSubmit && errors.contact_email
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                  )}
                />
                {attemptedSubmit && errors.contact_email && (
                  <div className="text-xs text-red-600 mt-1 font-semibold">
                    {errors.contact_email}
                  </div>
                )}
              </Field>
              <Field
                label="Contact Phone"
                right={
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <input
                      type="checkbox"
                      checked={form.show_contact_phone}
                      onChange={onChange("show_contact_phone")}
                    />
                    Show to Candidates
                  </label>
                }
              >
                <input
                  value={form.contact_phone}
                  onChange={onChange("contact_phone")}
                  placeholder="9999999999"
                  className={cls(
                    "w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
                    attemptedSubmit && errors.contact_phone
                      ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
                      : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
                  )}
                />
                {attemptedSubmit && errors.contact_phone && (
                  <div className="text-xs text-red-600 mt-1 font-semibold">
                    {errors.contact_phone}
                  </div>
                )}
              </Field>
            </div>
          </div>
        </Section>

        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
          <div className="text-xs text-slate-600 font-semibold">
            By publishing this job, you agree to Jobion’s{" "}
            <Link href="/terms" className="text-blue-700 hover:underline">
              Job Posting Policies
            </Link>
            .
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetToDefaults}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Form
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-sm font-semibold disabled:cursor-not-allowed enabled:bg-slate-900 enabled:text-white enabled:hover:bg-slate-800"
            >
              {submitting ? "Publishing…" : "Publish Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="text-sm font-bold text-slate-800 mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
          {label}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  auto,
}: {
  value: string;
  onChange: (e: any) => void;
  options: string[];
  auto?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={cls(
          "w-full appearance-none rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4",
          auto
            ? "border-blue-200 bg-blue-50 text-slate-700 focus:ring-blue-100"
            : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

function RoleCombobox({
  value,
  roles,
  loading,
  onPick,
  hasError,
}: {
  value: Role | null;
  roles: Role[];
  loading: boolean;
  onPick: (r: Role | null) => void;
  hasError?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, roles]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const t = e.target as any;
      if (!root.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const picked = filtered[active];
        if (picked) {
          onPick(picked);
          setOpen(false);
          setQuery("");
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, filtered, onPick, open]);

  const displayLabel = value?.name || "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cls(
          "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-4 text-left",
          hasError
            ? "border-red-200 bg-red-50 text-red-900 focus:ring-red-100"
            : "border-slate-200 bg-white text-slate-700 focus:ring-slate-100",
        )}
        disabled={loading}
      >
        <span className={cls("truncate", !displayLabel && "text-slate-400")}>
          {loading
            ? "Loading roles…"
            : displayLabel || "Select or type to search job role"}
        </span>
        <ChevronDown size={18} className="text-slate-400" />
      </button>

      {open && !loading && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="Type to search…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                No roles found
              </div>
            ) : (
              filtered.map((r, idx) => {
                const isActive = idx === active;
                const isSelected = value?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      onPick(r);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cls(
                      "w-full px-4 py-2.5 text-sm text-left flex items-center justify-between gap-3",
                      isActive ? "bg-slate-50" : "bg-white",
                    )}
                  >
                    <span className="truncate text-slate-700 font-semibold">
                      {r.name}
                    </span>
                    {isSelected ? (
                      <span className="text-xs font-extrabold text-emerald-700">
                        Selected
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onPick(null);
                setOpen(false);
                setQuery("");
              }}
              className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
            <div className="text-xs text-slate-400 px-2">
              Esc to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toTitleCase(s: string) {
  const clean = String(s || "").trim();
  if (!clean) return "";
  return clean
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

