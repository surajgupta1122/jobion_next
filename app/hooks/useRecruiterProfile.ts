"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/apiconfig/apiconfig.jsx";

export function useRecruiterProfile() {
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/recruiter-profile/recruiter");
        const recruiter = res?.data?.recruiter;
        // Minimal completeness check: profile exists + has company_name
        const complete = !!(recruiter && (recruiter.company_name || recruiter.companyName));
        if (mounted) setIsComplete(complete);
      } catch (err) {
        if (mounted) setIsComplete(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, isComplete };
}

