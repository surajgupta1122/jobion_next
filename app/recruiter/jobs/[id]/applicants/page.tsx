import RecruiterLayout from "@/app/components/layout/recruiter-layout/RecruiterLayout.jsx";
import ApplicantsPage from "@/app/modules/recruiter/applicants/ApplicantsPage";

export default async function RecruiterApplicantsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RecruiterLayout>
      <ApplicantsPage jobId={id} />
    </RecruiterLayout>
  );
}

