"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/components/apiconfig/apiconfig.jsx";

type FormState = {
  company_name: string;
  company_type: string;
  website: string;
  hr_name: string;
  hr_mobile: string;

  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export default function RecruiterProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    company_name: "",
    company_type: "",
    website: "",
    hr_name: "",
    hr_mobile: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/recruiter-profile/recruiter");
        const r = data?.recruiter;
        if (mounted && r) {
          setForm({
            company_name: r.company_name || "",
            company_type: r.company_type || "",
            website: r.website || "",
            hr_name: r.hr_name || "",
            hr_mobile: r.hr_mobile || "",
            address_line_1: r.address_line_1 || "",
            address_line_2: r.address_line_2 || "",
            city: r.city || "",
            state: r.state || "",
            country: r.country || "India",
            pincode: r.pincode || "",
          });
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.response?.data?.message || e?.message || "Failed to load profile");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onChange =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setSuccess(null);
      setError(null);
      setForm((s) => ({ ...s, [k]: e.target.value }));
    };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const { data } = await api.put("/recruiter-profile/recruiter", form);
      if (!data?.success) throw new Error(data?.message || "Failed to save");
      setSuccess("Profile updated successfully.");
      setTimeout(() => router.push("/recruiter-profile"), 700);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-600">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Recruiter Profile</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Update your company information and contact details
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <Section title="Company Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name">
            <input value={form.company_name} onChange={onChange("company_name")} className={inputCls} />
          </Field>
          <Field label="Company Type">
            <input value={form.company_type} onChange={onChange("company_type")} className={inputCls} />
          </Field>
          <Field label="Website">
            <input value={form.website} onChange={onChange("website")} className={inputCls} />
          </Field>
          <Field label="HR Name">
            <input value={form.hr_name} onChange={onChange("hr_name")} className={inputCls} />
          </Field>
          <Field label="HR Mobile">
            <input value={form.hr_mobile} onChange={onChange("hr_mobile")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Company Address">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Address Line 1">
            <input value={form.address_line_1} onChange={onChange("address_line_1")} className={inputCls} />
          </Field>
          <Field label="Address Line 2">
            <input value={form.address_line_2} onChange={onChange("address_line_2")} className={inputCls} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={onChange("city")} className={inputCls} />
          </Field>
          <Field label="State">
            <input value={form.state} onChange={onChange("state")} className={inputCls} />
          </Field>
          <Field label="Country">
            <input value={form.country} onChange={onChange("country")} className={inputCls} />
          </Field>
          <Field label="Pincode">
            <input value={form.pincode} onChange={onChange("pincode")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/recruiter-profile")}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#AD1717] text-white text-sm font-semibold hover:bg-[#991B1B] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="text-sm font-bold text-slate-800 mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

