"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";
import { ChevronDown, CheckCircle2 } from "lucide-react";

type Role = { id: number; name: string };

type FiltersResponse = {
  ok: boolean;
  filters?: {
    roles?: Role[];
  };
};

type FormState = {
  role_id: string;
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

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const WORK_MODES = ["Office", "Remote", "Hybrid"];

export default function CreateJob() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const [form, setForm] = useState<FormState>({
    role_id: "",
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

  const canSubmit = useMemo(() => {
    return (
      !!form.role_id &&
      !!form.company.trim() &&
      !!form.state.trim() &&
      !!form.city.trim() &&
      !!form.description.trim() &&
      !!form.contact_email.trim() &&
      confirm &&
      !submitting
    );
  }, [form, confirm, submitting]);

  const onChange = (k: keyof FormState) => (e: any) => {
    setSuccess(null);
    setError(null);
    const v =
      e?.target?.type === "checkbox" ? !!e.target.checked : e?.target?.value;
    setForm((s) => ({ ...s, [k]: v }));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        ...form,
        role_id: Number(form.role_id),
        vacancies: Number(form.vacancies || 0),
        min_experience: Number(form.min_experience || 0),
        max_experience: Number(form.max_experience || 0),
        min_salary: form.min_salary ? Number(form.min_salary) : null,
        max_salary: form.max_salary ? Number(form.max_salary) : null,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const { data } = await api.post("/recruiter/jobs", payload);
      if (!data?.ok) throw new Error(data?.message || "Failed to create job");
      setSuccess("Job created successfully and sent for approval.");
      setConfirm(false);
      // keep form values as-is (matches screenshot UX), but you can reset if desired
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create job");
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

      <div className="space-y-5">
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Job Role *">
              <div className="relative">
                <select
                  value={form.role_id}
                  onChange={onChange("role_id")}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
                  disabled={loadingRoles}
                >
                  <option value="">
                    {loadingRoles ? "Loading roles…" : "-- Select or type to search job role --"}
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Selecting a role will auto-fill related fields
              </div>
            </Field>

            <Field label="Company *">
              <input
                value={form.company}
                onChange={onChange("company")}
                placeholder="Company name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-1">
              <Field label="Job Type">
                <Select value={form.job_type} onChange={onChange("job_type")} options={JOB_TYPES} />
              </Field>
              <Field label="Work Mode">
                <Select value={form.work_mode} onChange={onChange("work_mode")} options={WORK_MODES} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Location & Openings">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Country">
              <input
                value={form.country}
                onChange={onChange("country")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label="State *">
              <input
                value={form.state}
                onChange={onChange("state")}
                placeholder="State"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label="City *">
              <input
                value={form.city}
                onChange={onChange("city")}
                placeholder="City"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
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
                className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label="Max Experience (Yrs)">
              <input
                value={form.max_experience}
                onChange={onChange("max_experience")}
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label="Min Salary / Month">
              <input
                value={form.min_salary}
                onChange={onChange("min_salary")}
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label="Max Salary / Month">
              <input
                value={form.max_salary}
                onChange={onChange("max_salary")}
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
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
                className="w-full min-h-[160px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </Field>
            <Field label="Skills & Technologies">
              <input
                value={form.skills}
                onChange={onChange("skills")}
                placeholder="Enter skills separated by commas (e.g. React, Node.js, SQL)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
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
              <Field label="Contact Email *">
                <input
                  value={form.contact_email}
                  onChange={onChange("contact_email")}
                  placeholder="contact@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
                />
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
                />
              </Field>
            </div>
          </div>
        </Section>

        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
          <label className="flex items-start gap-3 text-sm text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm this is a genuine job opening and I agree to Jobion’s job
              posting policies.
            </span>
          </label>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setForm((s) => ({
                  ...s,
                  role_id: "",
                  company: "",
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
                  job_type: "Full-time",
                  work_mode: "Office",
                  country: "India",
                }));
                setConfirm(false);
                setError(null);
                setSuccess(null);
              }}
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
}: {
  value: string;
  onChange: (e: any) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100"
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

