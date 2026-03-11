"use client";

import RecruiterLayout from "@/app/components/layout/recruiter-layout/RecruiterLayout.jsx";
import RecruiterProfileForm from "@/app/modules/recruiter/profile/RecruiterProfileForm";

export default function Page() {
  return (
    <RecruiterLayout>
      <RecruiterProfileForm />
    </RecruiterLayout>
  );
}

