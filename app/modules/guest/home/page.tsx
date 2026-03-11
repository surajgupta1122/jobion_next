import Categories from "./Categories";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import { Suspense } from "react";

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
        <Hero />
      </Suspense>
      <Categories />
      <HowItWorks />
    </div>
  );
}
