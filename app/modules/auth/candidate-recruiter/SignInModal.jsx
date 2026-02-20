"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import api from "../../../components/apiconfig/apiconfig.jsx";

export default function SignInModal({ role = "candidate", onClose, redirectTo = null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const handleGoogleSuccessRef = useRef(null);

  // Decide where to send based on role + profile existence
  const resolveRedirect = useCallback(async (resolvedRole) => {
    try {
      if (resolvedRole === "recruiter") {
        await api.get("/recruiter-profile/recruiter");
        // Profile exists - redirect to Post Job page (default dashboard view)
        return "/create-job";
      }

      await api.get("/profile/user");
      return "/dashboard";
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        // If coming from "post a job" flow and profile doesn't exist, go to profile form
        if (resolvedRole === "recruiter" && redirectTo === "post-job") {
          return "/recruiter-profile-form";
        }
        return resolvedRole === "recruiter"
          ? "/recruiter-profile-form"
          : "/dashboard/profile";
      }
      return resolvedRole === "recruiter" ? "/create-job" : "/dashboard";
    }
  }, [redirectTo]);

  // GOOGLE LOGIN SUCCESS HANDLER
  const handleGoogleSuccess = useCallback(async (response) => {
    if (!termsAccepted) {
      setError("Please accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Map role prop: "user" -> "candidate" for backend, "recruiter" -> "recruiter"
      const roleToSend = role === "recruiter" ? "recruiter" : "candidate";

      const { data } = await api.post("/auth/google", {
        credential: response.credential,
        role: roleToSend
      });

      const userRole = data?.user?.role || role;

      let redirectPath = null;
      try {
        redirectPath = await resolveRedirect(userRole);
      } catch (redirectErr) {
        console.error("Google sign-in (modal): Error determining redirect", redirectErr);
        // Use fallback
        redirectPath = userRole === "recruiter" ? "/create-job" : "/dashboard";
      }

      if (!redirectPath) {
        redirectPath = userRole === "recruiter" ? "/create-job" : "/dashboard";
      }
      window.location.replace(redirectPath);
    } catch (err) {
      console.error("Google sign-in (modal): Error", err);
      setError(err?.response?.data?.message || "Google login failed");
      setLoading(false);
    }
  }, [termsAccepted, role, resolveRedirect]);

  // Keep ref updated
  useEffect(() => {
    handleGoogleSuccessRef.current = handleGoogleSuccess;
  }, [handleGoogleSuccess]);

  // LOAD GOOGLE BUTTON (Google Identity Services)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing. Please set it in your client/.env file.");
      return;
    }

    // Wait for Google script to load
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max wait time
    const initializeGoogleAuth = () => {
      if (typeof window === "undefined" || !window.google || !window.google.accounts?.id) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Retry after a short delay if script not loaded yet
          setTimeout(initializeGoogleAuth, 100);
        } else {
          console.error("Google Identity script failed to load after multiple retries.");
        }
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSuccess,
        });

        const buttonContainer = document.getElementById("google-login-btn");
        if (buttonContainer) {
          // Clear previous button if exists
          buttonContainer.innerHTML = "";
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            // width must be a number (px) per GIS docs; we handle 100% with CSS on the container
            width: 320,
            type: "standard",
            text: "signin_with", // "Sign in with Google"
            disabled: !termsAccepted,
          });
        }
      } catch (err) {
        console.error("Error initializing Google auth:", err);
      }
    };

    // Start initialization
    initializeGoogleAuth();
  }, [role, termsAccepted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg">
        <div className="w-full rounded-2xl shadow-lg bg-white border border-gray-200">
          <div className="px-6 pt-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold">
                {role === "recruiter"
                  ? "Sign in as Recruiter"
                  : "Sign in as Candidate"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign in with your Google account
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div className="flex flex-col items-center gap-4">
              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-2 w-full pt-2">
                <input
                  type="checkbox"
                  id="terms-checkbox-modal"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms-checkbox-modal" className="text-xs text-gray-700 cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-primary-600 hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-primary-600 hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  of Jobion.
                </label>
              </div>

              <div id="google-login-btn" className="flex justify-center w-full" />

              {loading && (
                <p className="text-sm text-slate-500 text-center">
                  Please wait...
                </p>
              )}

              {message && (
                <p className="text-green-600 text-sm text-center">{message}</p>
              )}
              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <p className="text-xs text-center text-slate-500">
                Currently signing in as{" "}
                <b>{role === "recruiter" ? "Recruiter" : "Candidate"}</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

