"use client";

import { useState, useEffect, useRef } from "react";

export default function HowItWorks() {
  // 🔹 Fade animation
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // 🔹 Tabs
  const [tab, setTab] = useState<"seekers" | "recruiters">("seekers");

  // 🔹 Data
  const seekerSteps = [
    { title: "Search", desc: "Find jobs by city, role or skill." },
    { title: "Apply", desc: "Send your details in a few taps." },
    { title: "Interview", desc: "Talk to the recruiter or company." },
    { title: "Get hired", desc: "Join and start earning faster." },
  ];

  const recruiterSteps = [
    { title: "Post job", desc: "Share your opening with basic details." },
    { title: "Review", desc: "See matching candidates in one list." },
    { title: "Interview", desc: "Call or message shortlisted profiles." },
    { title: "Hire", desc: "Close the role and grow your team." },
  ];

  const steps = tab === "seekers" ? seekerSteps : recruiterSteps;

  return (
    <section
      ref={ref}
      className={`bg-white transition-all duration-1000 ease-out px-4 py-12 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-[6%]">

        {/* 🔹 Heading */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            How it works
          </h2>
          <p className="text-sm sm:text-lg text-gray-500/80 font-medium mt-2">
            Same simple flow for job seekers and recruiters. No confusing steps.
          </p>
        </div>

        {/* 🔹 Tabs */}
        <div className="mb-6 sm:mb-8 inline-flex bg-white border-2 border-gray-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setTab("seekers")}
            className={`px-5 sm:px-7 py-2 cursor-pointer rounded-full text-sm sm:text-base font-semibold transition-all ${
              tab === "seekers"
                ? "bg-[#BB1919] text-white shadow-sm"
                : "text-gray-600 hover:text-[#A01616]"
            }`}
          >
            For Job Seekers
          </button>

          <button
            onClick={() => setTab("recruiters")}
            className={`px-5 sm:px-7 py-2 cursor-pointer rounded-full text-sm sm:text-base font-semibold transition-all ${
              tab === "recruiters"
                ? "bg-[#BB1919] text-white shadow-sm"
                : "text-gray-600 hover:text-[#A01616]"
            }`}
          >
            For Recruiters
          </button>
        </div>

        {/* 🔹 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="bg-white border border-gray-200 rounded-xl shadow-md 
                         hover:shadow-xl hover:shadow-red-100 hover:-translate-y-1 
                         transition-all duration-200"
            >
              <div className="p-4 sm:p-5 space-y-3">

                {/* Number */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full 
                                bg-[#FEF2F2] text-[#A01616] border-2 border-[#FEE2E2] font-bold">
                  {index + 1}
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-lg text-gray-500/80 font-medium">
                  {step.desc}
                </p>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
