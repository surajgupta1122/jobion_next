"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, Menu, X, PlusCircle } from "lucide-react";
import api from "../../../components/apiconfig/apiconfig";

/**
 * Recruiter Header - Navigation for recruiter dashboard
 * Menu items: Dashboard, My Jobs, My Profile, Post a Job
 * Highlights active route
 */
export default function RecruiterHeader() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Navigation menu items for recruiters
  const navItems = [
    { label: "Dashboard", path: "/recruiter-dashboard" },
    { label: "My Jobs", path: "/job-posted" },
    { label: "My Profile", path: "/recruiter-profile" },
    { label: "Post a Job", path: "/create-job", icon: PlusCircle },
  ];

  // Check if a nav item is active
  const isActive = (path) => {
    return pathname === path;
  };

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const res = await api.get("/auth/session");
        if (mounted) setUser(res.data.user || null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function formatCreatedDate(u) {
    if (!u) return "-";
    const d =
      u.created_at ||
      u.createdAt ||
      u.created ||
      u.createdAtDate ||
      u.createdAtUTC;
    try {
      const date = d ? new Date(d) : null;
      return date ? date.toLocaleDateString() : "-";
    } catch (e) {
      return "-";
    }
  }

  function formatLoginTime(u) {
    if (!u) return "-";
    const d = u.loginAt || u.last_login || u.lastLogin || u.loggedInAt;
    try {
      const date = d ? new Date(d) : null;
      return date ? date.toLocaleString() : "-";
    } catch (e) {
      return "-";
    }
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
      setUser(null);
      setOpen(false);
      router.push("/sign-in");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-xl"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
  
        {/* Logo */}
        <Link
          href="/recruiter-dashboard"
          className="flex items-center gap-2.5 sm:gap-3 hover:opacity-90 transition-opacity justify-self-start"
        >
          <b className="text-xl sm:text-2xl font-black tracking-widest text-red-700">
            Job<span className="text-red-900 font-serif">i</span>on
          </b>
        </Link>
  
        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3 justify-self-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all inline-flex items-center gap-1.5 ${
                  isActive(item.path)
                    ? "bg-red-700 text-white"
                    : "text-slate-700 hover:bg-red-700 hover:text-white"
                }`}
              >
                {Icon && <Icon size={16} />}
                {item.label}
              </Link>
            );
          })}
        </nav>
  
        {/* User Section */}
        <div className="flex items-center gap-2 justify-self-end">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-red-700 text-white grid place-items-center text-sm font-bold shadow-sm">
                {user?.name || user?.username
                  ? (user.name || user.username).charAt(0).toUpperCase()
                  : <User size={18} />}
              </div>
            </button>
  
            {open && (
              <div className="absolute right-0 mt-3 w-72 bg-white text-slate-900 rounded-xl shadow-2xl p-5 z-50 border border-gray-200">
  
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Name
                    </div>
                    <div className="font-semibold text-lg">
                      {user?.name || user?.fullname || user?.username || "-"}
                    </div>
                  </div>
  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Username
                    </div>
                    <div className="font-medium text-sm">
                      {user?.username || user?.email || "-"}
                    </div>
                  </div>
  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Role
                    </div>
                    <span className="inline-flex px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-semibold border border-red-200">
                      {user?.role || "-"}
                    </span>
                  </div>
  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Member since
                    </div>
                    <div className="font-medium text-sm">
                      {formatCreatedDate(user)}
                    </div>
                  </div>
  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Last login
                    </div>
                    <div className="font-medium text-sm">
                      {formatLoginTime(user)}
                    </div>
                  </div>
                </div>
  
                <div className="pt-5 mt-5 border-t border-gray-200 space-y-3">
                  <Link
                    href="/recruiter-profile"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition font-semibold text-sm border border-red-200"
                  >
                    View Profile
                  </Link>
  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-lg bg-red-700 hover:bg-red-800 transition-colors font-semibold text-sm text-white shadow-sm"
                  >
                    Logout
                  </button>
                </div>
  
              </div>
            )}
          </div>
  
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
  
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-3 px-4 rounded-lg text-base font-medium transition ${
                    isActive(item.path)
                      ? "bg-red-50 text-red-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {Icon && <Icon size={18} />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

