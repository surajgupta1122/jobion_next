"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "../../../components/apiconfig/apiconfig";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignIn() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const redirectParam = searchParams.get("redirect");

  const [role, setRole] = useState(
    roleParam === "recruiter" ? "recruiter" : "candidate",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pathname = usePathname();
  const handleGoogleSuccessRef = useRef(null);

  // Update role when query parameter changes
  useEffect(() => {
    if (roleParam === "recruiter") {
      setRole("recruiter");
    } else if (roleParam === "candidate") {
      setRole("candidate");
    }
  }, [roleParam]);

  // Decide where to send the user based on role + profile existence
  const resolveRedirect = useCallback(
    async (resolvedRole) => {
      try {
        if (resolvedRole === "recruiter") {
          // Recruiter profile exists? → recruiter dashboard
          await api.get("/recruiter-profile/recruiter");
          return "/recruiter-dashboard";
        }

        // Candidate profile exists? → candidate dashboard
        await api.get("/profile/user");
        return "/dashboard";
      } catch (err) {
        // 404 means profile not created yet
        const status = err?.response?.status;
        if (status === 404) {
          // If coming from "post a job" flow and profile doesn't exist, go to profile form
          if (resolvedRole === "recruiter" && redirectParam === "post-job") {
            return "/recruiter-profile-form";
          }
          return resolvedRole === "recruiter"
            ? "/recruiter-profile-form"
            : "/dashboard/profile";
        }
        // Fallback to default destinations on other errors
        return resolvedRole === "recruiter" ? "/recruiter-dashboard" : "/dashboard";
      }
    },
    [redirectParam],
  );

  const consumePostLoginTasks = useCallback(
    async (userRoleFallback) => {
      const getItem = (key) => {
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      };

      const removeItem = (key) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // ignore storage errors
        }
      };

      const pendingJobId = getItem("postLoginSaveJobId");
      const pendingApplyJobId = getItem("postLoginApplyJobId");
      const pendingRedirect = getItem("postLoginRedirect");

      // Handle save job flow
      if (pendingJobId) {
        try {
          await api.post(`/jobs/save/${pendingJobId}`);
          setMessage("Job saved successfully after sign-in.");
        } catch (err) {
          setMessage("Signed in, but we could not save the job automatically.");
        }
        removeItem("postLoginSaveJobId");
      }

      // Handle apply job flow (only for candidates)
      // Don't auto-apply, just redirect back to job page so user can click Apply Now manually
      if (pendingApplyJobId && userRoleFallback === "candidate") {
        // Check if profile exists and is complete
        let profileComplete = false;
        try {
          const profileRes = await api.get("/profile/user");
          if (profileRes?.data?.success && profileRes.data.user) {
            const profile = profileRes.data.user;
            const sessionRes = await api.get("/auth/session");
            const userEmail = sessionRes?.data?.user?.email;
            // Check if profile has required fields: name, email, and resume
            profileComplete = !!(
              profile.full_name &&
              userEmail &&
              profile.resume_path
            );
          }
        } catch (err) {
          // Profile doesn't exist or incomplete
          profileComplete = false;
        }

        if (!profileComplete) {
          // Profile incomplete - redirect to complete profile
          // Keep the apply job ID and redirect path for after profile completion
          // Don't remove them yet - profile page will handle the apply and cleanup
          return "/dashboard/profile";
        }

        // Profile is complete - just redirect back to job page
        // User will need to click Apply Now button manually
        removeItem("postLoginApplyJobId");
        if (pendingRedirect) {
          removeItem("postLoginRedirect");
          return pendingRedirect;
        }
        // Fallback: redirect to jobs page if no redirect path
        return "/jobs";
      }

      removeItem("postLoginRedirect");

      const fallbackRedirect = await resolveRedirect(userRoleFallback);
      const next = pendingRedirect || fallbackRedirect || "/dashboard";

      return next;
    },
    [resolveRedirect, setMessage],
  );

  // GOOGLE LOGIN SUCCESS HANDLER
  const handleGoogleSuccess = useCallback(
    async (response) => {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const { data } = await api.post("/auth/google", {
          credential: response.credential,
          role: role,
        });

        const userRole = data?.user?.role || role;

        // Determine redirect path
        let redirectPath = null;

        try {
          redirectPath = await consumePostLoginTasks(userRole);
        } catch (redirectErr) {
          console.error(
            "Google sign-in: Error in post-login tasks",
            redirectErr,
          );
          // Continue with fallback even if post-login tasks fail
        }

        // Ensure we always have a redirect path
        if (!redirectPath) {
          redirectPath =
            userRole === "recruiter" ? "/recruiter-dashboard" : "/dashboard";
        }

        // Perform redirect - use replace to avoid adding to history
        // Use replace instead of href to avoid back button issues
        window.location.replace(redirectPath);
      } catch (err) {
        console.error("Google sign-in: Error", err);
        setError(err?.response?.data?.message || "Google login failed");
        setLoading(false);
      }
    },
    [role, consumePostLoginTasks],
  );

  // Keep ref updated
  useEffect(() => {
    handleGoogleSuccessRef.current = handleGoogleSuccess;
  }, [handleGoogleSuccess]);

  // Initialize Google auth (callback only; button triggers prompt)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return;
    }

    let retryCount = 0;
    const maxRetries = 50;
    const initializeGoogleAuth = () => {
      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.accounts?.id
      ) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(initializeGoogleAuth, 100);
        }
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (handleGoogleSuccessRef.current) {
              handleGoogleSuccessRef.current(response);
            }
          },
        });
      } catch (err) {
        console.error("Error initializing Google auth:", err);
      }
    };

    initializeGoogleAuth();
  }, [role]);

  const handleGoogleButtonClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(
        "Google sign-in is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment.",
      );
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.google?.accounts?.id
    ) {
      setError("");
      window.google.accounts.id.prompt();
    } else {
      setError("Google sign-in is loading. Please try again in a moment.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="px-4 lg:px-8 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900/96">
              Move your career forward with faster hiring and better pay
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-500 font-medium">
              Get local jobs in your city!
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md card shadow-md rounded-2xl border border-gray-200">
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 border-b border-gray-200 pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900/96">
                  Sign in to Jobion
                </h2>
                <p className="mt-1.5 text-sm text-gray-500/85 font-medium">
                  Welcome back! Sign in with Google
                </p>
              </div>

              <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 space-y-4 sm:space-y-5 pt-6">
                {/* Role Selection */}
                <div className="flex flex-col space-y-3">
                  <label className="label text-gray-900/96 font-medium ">
                    I want to sign in as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-2.5 p-2.5 sm:p-3 border rounded-xl cursor-pointer transition-all ${
                        role === "candidate"
                          ? "border-red-600 bg-red-50"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="candidate"
                        checked={role === "candidate"}
                        onChange={() => setRole("candidate")}
                        className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="font-medium text-sm sm:text-base text-gray-900">
                        Candidate
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-2.5 sm:p-3 border rounded-xl cursor-pointer transition-all ${
                        role === "recruiter"
                          ? "border-red-600 bg-red-50"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="recruiter"
                        checked={role === "recruiter"}
                        onChange={() => setRole("recruiter")}
                        className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="font-medium text-sm sm:text-base text-gray-900">
                        Recruiter
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 mt-8 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 shadow-md hover:shadow-lg hover:border-gray-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>

                <p className="text-xs text-gray-500/80 text-center mt-2">
                  By signing in, you agree to our{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-[#AD1717] hover:text-[#8F1212] hover:underline"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-[#AD1717] hover:text-[#8F1212] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                {message && (
                  <div className="text-[success-600] text-sm text-center bg-success-light border border-success-300 rounded-lg px-4 py-2.5">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="text-error-600 text-sm text-center bg-error-light border border-error-300 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
