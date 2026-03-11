"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/app/components/apiconfig/apiconfig.jsx";
import {
  Building2,
  Globe,
  ShieldCheck,
  ShieldAlert,
  User2,
  Phone,
  MapPin,
  Pencil,
  Calendar,
  Clock,
} from "lucide-react";

type Recruiter = Record<string, any>;

export default function RecruiterProfile() {
  const [loading, setLoading] = useState(true);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/recruiter-profile/recruiter");
        if (!data?.recruiter) throw new Error(data?.message || "Profile not found");
        if (mounted) setRecruiter(data.recruiter);
      } catch (e: any) {
        if (mounted) {
          setRecruiter(null);
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

  const companyName =
    recruiter?.company_name ||
    recruiter?.companyName ||
    recruiter?.company ||
    "Company";

  const companyType = recruiter?.company_type || recruiter?.companyType || "company";

  const verificationLabel =
    recruiter?.verification_status ||
    recruiter?.verificationStatus ||
    (recruiter?.is_verified ? "Verified" : "Pending Verification");

  const isVerified =
    String(verificationLabel).toLowerCase() === "verified" || recruiter?.is_verified === 1;

  const initials = useMemo(() => {
    const s = String(companyName || "").trim();
    return s ? s[0].toUpperCase() : "C";
  }, [companyName]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
          <div className="h-20 w-20 rounded-full bg-slate-100 mx-auto" />
          <div className="h-5 w-40 bg-slate-100 rounded mt-4 mx-auto" />
          <div className="h-4 w-24 bg-slate-100 rounded mt-2 mx-auto" />
          <div className="h-8 w-44 bg-slate-100 rounded mt-4 mx-auto" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
          <div className="h-6 w-56 bg-slate-100 rounded" />
          <div className="h-4 w-80 bg-slate-100 rounded mt-3" />
          <div className="h-48 bg-slate-100 rounded mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Recruiter Profile</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage your company information and recruitment details
          </p>
        </div>

        <Link
          href="/recruiter-profile-form"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#AD1717] text-white text-sm font-semibold hover:bg-[#991B1B]"
        >
          <Pencil size={16} />
          Edit Profile
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!recruiter ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600">
          Profile not found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Left card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white text-3xl font-bold">
                {initials}
              </div>
              <div className="mt-4 font-bold text-slate-900 text-lg truncate w-full">
                {companyName}
              </div>
              <div className="text-sm text-slate-500 font-medium">{companyType}</div>

              <div
                className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                  isVerified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isVerified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                {isVerified ? "Verified" : "Pending Verification"}
              </div>
            </div>
          </div>

          {/* Right sections */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="font-bold text-slate-900">Company Information</div>
                <div className="text-sm text-slate-500 font-medium mt-1">
                  Complete the business details and verification status
                </div>
              </div>

              <div className="p-6 space-y-6">
                <InfoBlock title="Company Details">
                  <InfoRow icon={<Building2 size={16} />} label="Company Name" value={companyName} />
                  <InfoRow icon={<Building2 size={16} />} label="Company Type" value={companyType} />
                  <InfoRow
                    icon={<Globe size={16} />}
                    label="Website"
                    value={
                      recruiter?.website ? (
                        <a
                          href={recruiter.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {recruiter.website}
                        </a>
                      ) : (
                        "Not provided"
                      )
                    }
                  />
                  <InfoRow
                    icon={isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    label="Verification Status"
                    value={
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isVerified
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isVerified ? "Verified" : "Pending Verification"}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={<User2 size={16} />}
                    label="HR Name"
                    value={recruiter?.hr_name || recruiter?.hrName || "Not provided"}
                  />
                  <InfoRow
                    icon={<Phone size={16} />}
                    label="HR Mobile"
                    value={recruiter?.hr_mobile || recruiter?.hrMobile || "Not provided"}
                  />
                </InfoBlock>

                <InfoBlock title="Company Address">
                  <InfoRow
                    icon={<MapPin size={16} />}
                    label="Address Line 1"
                    value={recruiter?.address_line_1 || recruiter?.addressLine1 || "Not provided"}
                  />
                  <InfoRow
                    icon={<MapPin size={16} />}
                    label="Address Line 2"
                    value={recruiter?.address_line_2 || recruiter?.addressLine2 || "Not provided"}
                  />
                  <InfoRow label="City" value={recruiter?.city || "Not provided"} />
                  <InfoRow label="State" value={recruiter?.state || "Not provided"} />
                  <InfoRow label="Country" value={recruiter?.country || "Not provided"} />
                  <InfoRow label="Pincode" value={recruiter?.pincode || "Not provided"} />
                </InfoBlock>

                <InfoBlock title="Profile Information">
                  <InfoRow
                    icon={<ShieldAlert size={16} />}
                    label="Verification Notes"
                    value={recruiter?.verification_notes || recruiter?.verificationNotes || "No notes provided"}
                  />
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="Profile Created"
                    value={formatDate(recruiter?.created_at || recruiter?.createdAt)}
                  />
                  <InfoRow
                    icon={<Clock size={16} />}
                    label="Last Updated"
                    value={formatDateTime(recruiter?.updated_at || recruiter?.updatedAt)}
                  />
                </InfoBlock>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
      <div className="font-bold text-slate-900 mb-4">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? <div className="mt-0.5 text-slate-500">{icon}</div> : <div className="w-4" />}
      <div className="min-w-0">
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-900 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

function formatDate(v: any) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

function formatDateTime(v: any) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

