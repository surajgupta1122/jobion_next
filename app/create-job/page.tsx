"use client";

import RecruiterLayout from "@/app/components/layout/recruiter-layout/RecruiterLayout.jsx";
import CreateJob from "@/app/modules/recruiter/jobs/CreateJob";

export default function Page() {
  return (
    <RecruiterLayout>
      <CreateJob />
    </RecruiterLayout>
  );
}

