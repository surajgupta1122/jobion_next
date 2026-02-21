"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import GuestNavbar from "./GuestNavbar.jsx";
import GuestFooter from "./GuestFooter.jsx";
import CandidateHeader from "../candidate-layout/CandidateHeader.jsx";
import ErrorBoundary from "../../ErrorBoundary";
import { ToastContainer } from "../../toast";
import api from "../../apiconfig/apiconfig";

/**
 * Guest Layout - For public pages (home, jobs, companies, etc.)
 * Includes Navbar and Footer (footer hidden on auth pages)
 * Shows CandidateHeader if user is logged in as candidate
 */
const GuestLayout = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Routes where we DON'T want to show the footer or candidate header
  const authRoutes = [
    "/sign-in",
    "/sign-up",
    "/forgot",
    "/sign-in-modal",
    "/admin/signin",
    "/admin/signup",
    "/create-job",
    "/modules/auth/candidate-recruiter",
    "/recruiter-dashboard",
    "/job-posted",
    "/recruiter-profile",
  ];

  const isAuthRoute =
    authRoutes.includes(pathname) ||
    authRoutes.some((p) => pathname.startsWith(p + "/"));

  // Check authentication status
  // Re-check when pathname changes to detect logout
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data } = await api.get("/auth/session");
        if (mounted) setUser(data?.user || null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const hideFooter = isAuthRoute;

  // Show CandidateHeader if user is logged in as candidate and not on auth pages
  const showCandidateHeader =
    !loading && user && user.role === "candidate" && !isAuthRoute;

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        {showCandidateHeader ? <CandidateHeader /> : <GuestNavbar />}
      </header>

      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {!hideFooter && (
        <footer>
          <GuestFooter />
        </footer>
      )}
      <ToastContainer />
    </div>
  );
};

export default GuestLayout;
