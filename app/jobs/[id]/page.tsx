import JobDetails from "@/app/modules/guest/jobs/JobDetails";

export default async function Page({ params }: { params: { id: string } }) {
  void params;
  return <JobDetails />;
}
