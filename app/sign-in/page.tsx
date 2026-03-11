import SignIn from "@/app/modules/auth/candidate-recruiter/SignIn";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <SignIn />
    </Suspense>
  );
}