import JobDetails from "@/app/modules/guest/jobs/JobDetails";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <JobDetails id={id} />;
}
