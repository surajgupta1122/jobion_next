"use client";

import Link from "next/link";
import { useState, FormEvent, JSX } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";

export default function Hero(): JSX.Element {
  const router = useRouter();

  // State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [experience, setExperience] = useState<string>("");

  // Submit handler
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);
    if (location) params.set("location", location);
    if (experience) params.set("experience", experience);

    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="min-h-[85vh] m-12 flex items-center justify-center bg-gray-[#FFFFFF] px-4">
      <div className="max-w-5xl w-full text-center ">

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-5">
          Trusted Opportunities for{" "}
          <span className="text-[#BB1919] ">Fresh Talent</span>
        </h1>

        {/* Search Box */}
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >

            {/* Job title */}
            <div>
              <label className="label text-gray-700 text-left font-semibold sm:text-center sm:block mb-1.5">
                Job title or skill
              </label>

              <div className="relative flex items-center gap-2.5 bg-white rounded-xl px-3.5 py-2.5 sm:py-3 border border-gray-200 focus-within:ring focus-within:ring-[#BB1919] transition-all shadow-sm">
                <Search size={18} className="text-[#BB1919]" />

                <input
                  type="text"
                  placeholder="e.g. Delivery, Telecaller"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-sm sm:text-base border-none placeholder-[#7D7280]/90 font-semibold"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="label text-gray-700 text-left font-semibold sm:text-center sm:block mb-1.5">
                City / area
              </label>

              <div className="relative flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 sm:py-3 focus-within:ring focus-within:ring-[#BB1919] transition-all shadow-sm">
                <MapPin size={18} className="text-[#BB1919]" />

                <input
                  type="text"
                  placeholder="e.g. Mumbai, Delhi, Remote"
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocation(e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-sm sm:text-base border-none placeholder-[#7D7280]/90 font-semibold"
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="label text-gray-700 text-left font-semibold sm:text-center sm:block mb-1.5">
                Experience
              </label>

              <select
                value={experience}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setExperience(e.target.value)
                }         
                className="w-full rounded-xl px-3.5 py-2.5 sm:py-3 bg-white border border-gray-200 text-sm sm:text-base outline-none focus-within:ring focus-within:ring-[#BB1919] focus:ring-[#BB1919]500/20 transition-all cursor-pointe shadow-sm"
              >
                <option value="">Any</option>
                <option value="fresher">Fresher / Entry</option>
                <option value="mid">0–2 years</option>
                <option value="senior">2+ years</option>
              </select>
            </div>

            {/* Button */}
            <div className="sm:col-span-2 lg:col-span-3 flex justify-center mt-2">
              <button
                type="submit"
                className="bg-[#AD1717] text-white text-xl px-11 py-3 rounded-xl font-semibold hover:scale-105 duration-250 transition"
              >
                Search Jobs
              </button>
            </div>

          </form>
        </div>
      </div>
    </section>
  );
}
