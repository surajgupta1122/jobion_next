"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, User, Menu, X, PlusCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../../components/apiconfig/apiconfig";
import SignInModal from "../../../modules/auth/candidate-recruiter/SignInModal";

/**
 * Guest Navbar - For public pages
 * Shows different navigation based on user role
 */
export default function GuestNavbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // auth popup
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("candidate"); // "candidate" (normal user) | "recruiter"

  // Navigation items for recruiters (when logged in)
  const recruiterNavItems = [
    { label: "Dashboard", path: "/recruiter-dashboard" },
    { label: "My Jobs", path: "/job-posted" },
    { label: "My Profile", path: "/recruiter-profile" },
    { label: "Post a Job", path: "/create-job", icon: PlusCircle },
  ];

  // Check if a nav item is active
  const isActive = (path) => {
    return pathname === path;
  };

  // Check if user is a recruiter
  const isRecruiter = user?.role === "recruiter";

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        const res = await api.get("/auth/session");
        if (mounted) setUser(res.data.user || null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfile();

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
      setMobileMenuOpen(false);
      router.push("/sign-in");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  function handleOpenAuth(role) {
    setSelectedRole(role); // "candidate" or "recruiter"
    setAuthOpen(true);
    setMobileMenuOpen(false); // Close mobile menu if open
  }

  return (
    <>
      <header className="sticky top-0 z-[999] border-b border-[#F6E0E0]/50 bg-white/90 backdrop-blur-xl text-gray-900 shadow-[0_8px_25px_rgba(187,25,25,0.25)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <b className="text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-[#AD1717] via-[#971414] to-[#971414] bg-clip-text text-transparent drop-shadow-sm hover:from-[#971414] hover:via-[#811111] hover:to-[#6B0E0E] transition-all duration-300">
                Job<span className="relative">
                  <span className="text-red-800 font-bold text-xl sm:text-2xl">i</span>
                </span>on
              </b>
            </Link>

            {/* Desktop Navigation Menu */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3">
              {isRecruiter ? (
                // Recruiter navigation
                recruiterNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-colors inline-flex items-center gap-1.5 ${isActive(item.path)
                        ? "bg-gradient-red text-white shadow-energy"
                        : "text-text-muted hover:bg-gradient-red hover:text-white hover:shadow-kinetic"
                        }`}
                    >
                      {Icon && <Icon size={16} />}
                      {item.label}
                    </Link>
                  );
                })
              ) : (
                // Guest/Candidate navigation
                <>
                  <Link
                    href="/"
                    className={`px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-colors ${isActive("/") || isActive("/home")
                      ? "bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-white shadow-energy"
                      : "text-text-muted hover:bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-gray-500 hover:text-white hover:shadow-kinetic"
                      }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/modules/guest/jobs"
                    className={`px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-colors ${isActive("/modules/guest/jobs") || pathname.startsWith("/modules/guest/jobs/")
                      ? "bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-white shadow-energy"
                      : "text-text-muted hover:bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-gray-500 hover:text-white hover:shadow-kinetic"
                      }`}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    href="/modules/auth/candidate-recruiter"
                    className="px-3 lg:px-4 py-2 rounded-full text-sm font-bold text-text-muted hover:bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-gray-500 hover:text-white hover:shadow-kinetic transition-colors"
                  >
                    Post a Job
                  </Link>
                </>
              )}
            </nav>

            {/* Buttons / Profile */}
            <div className="flex gap-2 sm:gap-3 items-center">
              {!loading && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-button hover:bg-gray-100 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={open}
                  >
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary-50 grid place-items-center text-sm font-semibold text-primary-700 flex-shrink-0">
                      {user.username ? (
                        user.username.charAt(0).toUpperCase()
                      ) : (
                        <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-text-dark">
                      {user.name || user.fullname || user.username}
                    </span>
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white text-text-dark rounded-xl shadow-large p-5 z-50 border border-border">
                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-1">Name</div>
                        <div className="font-semibold text-base">
                          {user.name || user.fullname || user.username || "-"}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-1">Username</div>
                        <div className="font-medium text-sm">{user.username || user.email || "-"}</div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-1">Role</div>
                        <div className="font-medium text-sm capitalize">{user.role || "-"}</div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-1">Member since</div>
                        <div className="font-medium text-sm">
                          {formatCreatedDate(user)}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-1">Last login</div>
                        <div className="font-medium text-sm">
                          {formatLoginTime(user)}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border space-y-2">
                        <Link
                          href={isRecruiter ? "/recruiter-profile" : "/profile"}
                          onClick={() => setOpen(false)}
                          className="block w-full text-left px-4 py-2.5 rounded-button bg-gray-50 hover:bg-gray-100 transition-colors font-medium text-sm"
                        >
                          View Profile
                        </Link>
                        {isRecruiter && (
                          <Link
                            href="/recruiter-dashboard"
                            onClick={() => setOpen(false)}
                            className="block w-full text-left px-4 py-2.5 rounded-button bg-primary-50 hover:bg-primary-100 transition-colors font-medium text-sm text-primary-700"
                          >
                            Go to Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 rounded-button bg-error-500 hover:bg-error-600 transition-colors font-medium text-sm text-white"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Candidate Login - Navigate to sign-in page */}
                  <Link
                    href="/modules/auth/candidate-recruiter?role=candidate"
                    className="hidden sm:inline-flex px-3 lg:px-4 py-2 rounded-full text-sm font-bold text-text-muted hover:bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-gray-500 hover:text-white hover:shadow-kinetic transition-colors"
                  >
                    Candidate Login
                  </Link>

                  {/* Recruiter Login - Navigate to sign-in page */}
                  <Link
                    href="/modules/auth/candidate-recruiter?role=recruiter"
                    className="px-3 lg:px-4 py-2 rounded-full text-sm font-bold text-text-muted hover:bg-gradient-to-r from-[#FB4C57] to-[#EA3D48] text-gray-500 hover:text-white hover:shadow-kinetic transition-colors"
                  >
                    <span className="hidden sm:inline">Recruiter Login</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-button hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-border">
            <nav className="px-4 sm:px-6 py-4 space-y-3">
              {isRecruiter ? (
                // Recruiter mobile navigation
                recruiterNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 py-3 px-4 rounded-lg text-base font-medium transition-colors ${isActive(item.path)
                        ? "bg-primary-50 text-primary-700"
                        : "text-text-dark hover:text-primary-600 hover:bg-gray-50"
                        }`}
                    >
                      {Icon && <Icon size={18} />}
                      {item.label}
                    </Link>
                  );
                })
              ) : (
                // Guest/Candidate mobile navigation
                <>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 font-medium text-base transition-colors ${isActive("/") || isActive("/home")
                      ? "text-primary-600"
                      : "text-text-dark hover:text-primary-600"
                      }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 font-medium text-base transition-colors ${isActive("/jobs") || pathname.startsWith("/jobs/")
                      ? "text-primary-600"
                      : "text-text-dark hover:text-primary-600"
                      }`}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    href="/sign-in?role=recruiter&redirect=post-job"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-text-dark hover:text-primary-600 transition-colors font-medium text-base"
                  >
                    Post a Job
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-text-dark hover:text-primary-600 transition-colors font-medium text-base"
                  >
                    Contact
                  </Link>
                </>
              )}
              {!loading && !user && (
                <div className="pt-4 border-t border-border space-y-2">
                  <Link
                    href="/sign-in?role=candidate"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-button text-sm font-semibold text-primary-600 border-2 border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    Candidate Login
                  </Link>
                  <Link
                    href="/sign-in?role=recruiter"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-button text-sm font-semibold text-primary-600 border-2 border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    Recruiter Login
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Auth popup modal */}
      {authOpen && (
        <SignInModal
          role={selectedRole}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </>
  );
}

