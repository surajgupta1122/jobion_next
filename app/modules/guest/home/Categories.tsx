"use client";

import { useRouter } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Clock,
  Users,
  UserPlus,
  Send,
  Building2,
  Briefcase,
  ArrowRight,
} from "lucide-react";

import { jobCategories } from "./data";

const iconMap: Record<string, any> = {
  mapPin: MapPin,
  clock: Clock,
  users: Users,
  userPlus: UserPlus,
  send: Send,
  building: Building2,
  briefcase: Briefcase,
  arrowRight: ArrowRight,
};

export default function Categories() {
  const router = useRouter();

  const handleClick = (categoryId: string) => {
    router.push(`/jobs?category=${categoryId}`);
  };

  return (
    <section className="bg-[#F7FAFF] py-12 px-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">

        {/* Heading */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-[#1E2235]">
            Browse by category
          </h2>
          <p className="text-sm sm:text-lg mt-2 font-medium text-gray-500/80">
            Tap a card to see jobs only from that category.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobCategories.map((cat) => {
            const Icon = iconMap[cat.icon] || Briefcase;

            return (
              <button
                key={cat.id}
                onClick={() => handleClick(cat.id)}
                className="text-left group cursor-pointer"
              >
                <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-md  
                                hover:shadow-xl hover:shadow-red-100 hover:-translate-y-1 transition-all duration-200">
                
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-[#FEF2F2] flex items-center justify-center border border-[#FEE2E2] border-2">
                    <Icon size={22} className="text-[#A01616]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-xl">
                      {cat.label}
                    </p>

                    <p className="text-base font-semibold text-gray-400 mt-1">
                      {cat.count} open roles
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={22}
                    className="text-[#A01616] group-hover:translate-x-1 transition"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
