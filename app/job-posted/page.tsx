"use client";

import RecruiterLayout from "@/app/components/layout/recruiter-layout/RecruiterLayout.jsx";
import MyJobs from "@/app/modules/recruiter/jobs/MyJobs";

export default function Page() {
  return (
    <RecruiterLayout>
      <MyJobs />
    </RecruiterLayout>
  );
}

