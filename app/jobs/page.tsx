import JobList from "../modules/guest/jobs/JobList";
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <Suspense fallback={<div className="p-6 text-gray-600">Loading jobs…</div>}>
        <JobList />
      </Suspense>
    </div>
  );
}
