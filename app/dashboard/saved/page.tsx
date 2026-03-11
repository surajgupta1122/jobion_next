import CandidateLayout from "@/app/components/layout/candidate-layout/CandidateLayout";
import SavedList from "@/app/modules/candidate/jobs/savedList";

export default function SavedJobsPage() {
  return (
    <CandidateLayout>
      <SavedList />
    </CandidateLayout>
  );
}

