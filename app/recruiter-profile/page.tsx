"use client";

import RecruiterLayout from "@/app/components/layout/recruiter-layout/RecruiterLayout.jsx";
import RecruiterProfile from "@/app/modules/recruiter/profile/RecruiterProfile";

export default function Page() {
  return (
    <RecruiterLayout>
      <RecruiterProfile />
    </RecruiterLayout>
  );
}

