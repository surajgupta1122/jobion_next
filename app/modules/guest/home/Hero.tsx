"use client";

import Link from "next/link";
import { useState, FormEvent, JSX, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, X, Briefcase } from "lucide-react";

// Sample suggestions data - in production, this would come from an API
const JOB_SUGGESTIONS = [
  "Delivery Boy",
  "Telecaller",
  "Security Guard",
  "Data Entry Operator",
  "Driver",
  "Housekeeping Staff",
  "Office Boy",
  "Sales Executive",
  "Customer Support Executive",
  "Back Office Executive",
  "Electrician",
  "Plumber",
  "Mechanic",
  "Helper",
  "Warehouse Executive",
  "Packing Executive",
  "Computer Operator",
  "Field Technician",
  "Store Helper",
  "Loader",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "HR Intern",
  "Marketing Intern"
];

const LOCATION_SUGGESTIONS = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Lucknow",
  "Noida",
  "Gurgaon",
  "Remote",
  "Work from Home",
  "Deoria",
  "Devbhoomi Dwarka",
  "Greater Noida",
  "Hisar"
];

export default function Hero(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Suggestions state
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filteredJobSuggestions, setFilteredJobSuggestions] = useState<string[]>([]);
  const [filteredLocationSuggestions, setFilteredLocationSuggestions] = useState<string[]>([]);
  
  // Refs for click outside detection
  const jobInputRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLDivElement>(null);

  // Load filters from URL on mount
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const loc = searchParams.get("location") || "";
    const exp = searchParams.get("experience") || "";

    setSearchTerm(q);
    setLocation(loc);
    setExperience(exp);

    // Build active filters array
    const filters: string[] = [];
    if (q) filters.push(`Job: ${q}`);
    if (loc) filters.push(`Location: ${loc}`);
    if (exp) {
      const expLabel = 
        exp === "fresher" ? "Fresher / Entry" :
        exp === "mid" ? "0–2 years" :
        exp === "senior" ? "2+ years" : exp;
      filters.push(`Experience: ${expLabel}`);
    }
    setActiveFilters(filters);
  }, [searchParams]);

  // Filter job suggestions based on input
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredJobSuggestions(JOB_SUGGESTIONS.slice(0, 5));
    } else {
      const filtered = JOB_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setFilteredJobSuggestions(filtered);
    }
  }, [searchTerm]);

  // Filter location suggestions based on input
  useEffect(() => {
    if (location.trim() === "") {
      setFilteredLocationSuggestions(LOCATION_SUGGESTIONS.slice(0, 5));
    } else {
      const filtered = LOCATION_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(location.toLowerCase())
      ).slice(0, 5);
      setFilteredLocationSuggestions(filtered);
    }
  }, [location]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (jobInputRef.current && !jobInputRef.current.contains(event.target as Node)) {
        setShowJobSuggestions(false);
      }
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Submit handler
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);
    if (location) params.set("location", location);
    if (experience) params.set("experience", experience);

    router.push(`/jobs?${params.toString()}`);
  };

  // Remove individual filter
  const removeFilter = (filterToRemove: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filterToRemove.startsWith("Job:")) {
      params.delete("q");
      setSearchTerm("");
    } else if (filterToRemove.startsWith("Location:")) {
      params.delete("location");
      setLocation("");
    } else if (filterToRemove.startsWith("Experience:")) {
      params.delete("experience");
      setExperience("");
    }

    router.push(`/jobs?${params.toString()}`);
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push("/jobs");
  };

  // Select suggestion
  const selectJobSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowJobSuggestions(false);
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setShowLocationSuggestions(false);
  };

  return (
    <section className="min-h-[80vh] w-full flex items-center justify-center bg-white px-4 pt-16 pb-20">
      <div className="max-w-6xl w-full text-center">

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.3rem] font-extrabold text-gray-900 leading-tight mb-6">
          Trusted Opportunities for{" "}
          <span className="text-[#BB1919] ">Fresh Talent</span>
        </h1>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded-lg text-sm"
              >
                <span>{filter}</span>
                <button
                  onClick={() => removeFilter(filter)}
                  className="hover:bg-[#FECACA] rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${filter} filter`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-[#AD1717] hover:text-[#991B1B] font-medium underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Search Box */}
        <div className="bg-[#F7F7FB] border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-md max-w-5xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >

            {/* Job title with suggestions */}
            <div ref={jobInputRef} className="relative">
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
                  onFocus={() => setShowJobSuggestions(true)}
                  className="w-full bg-transparent outline-none text-sm sm:text-base border-none placeholder-[#7D7280]/90 font-semibold"
                />
              </div>

              {/* Job Suggestions Dropdown */}
              {showJobSuggestions && filteredJobSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredJobSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectJobSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <Briefcase size={16} className="text-[#BB1919]" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location with suggestions */}
            <div ref={locationInputRef} className="relative">
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
                  onFocus={() => setShowLocationSuggestions(true)}
                  className="w-full bg-transparent outline-none text-sm sm:text-base border-none placeholder-[#7D7280]/90 font-semibold"
                />
              </div>

              {/* Location Suggestions Dropdown */}
              {showLocationSuggestions && filteredLocationSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredLocationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectLocationSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <MapPin size={16} className="text-[#BB1919]" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
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
                className="w-full rounded-xl px-3.5 py-2.5 sm:py-3 bg-white border border-gray-200 text-sm sm:text-base outline-none focus-within:ring focus-within:ring-[#BB1919] focus:ring-[#BB1919]500/20 transition-all cursor-pointer shadow-sm"
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