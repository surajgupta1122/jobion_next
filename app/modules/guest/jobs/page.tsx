import JobList from "./JobList";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading jobs…</div>}>
      <JobList />
    </Suspense>
  );
}

