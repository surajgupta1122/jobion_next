"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "../../../components/apiconfig/apiconfig";

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
  const [termsAccepted, setTermsAccepted] = useState(false);
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
          // Recruiter profile exists?
          await api.get("/recruiter-profile/recruiter");
          // Profile exists - redirect to Post Job page (default dashboard view)
          return "/create-job";
        }

        // Candidate profile exists?
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
        return resolvedRole === "recruiter" ? "/create-job" : "/dashboard";
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
      if (!termsAccepted) {
        setError(
          "Please accept the Terms & Conditions and Privacy Policy to continue.",
        );
        return;
      }

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
            userRole === "recruiter" ? "/create-job" : "/dashboard";
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
    [termsAccepted, role, consumePostLoginTasks],
  );

  // Keep ref updated
  useEffect(() => {
    handleGoogleSuccessRef.current = handleGoogleSuccess;
  }, [handleGoogleSuccess]);

  // LOAD GOOGLE BUTTON
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing. Please set it in your .env.local file.",
      );
      return;
    }

    // Wait for Google script to load
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max wait time
    const initializeGoogleAuth = () => {
      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.accounts?.id
      ) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Retry after a short delay if script not loaded yet
          setTimeout(initializeGoogleAuth, 100);
        } else {
          console.error(
            "Google Identity script failed to load after multiple retries.",
          );
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

        const buttonContainer = document.getElementById("google-login-btn");
        if (buttonContainer) {
          // Clear previous button if exists
          buttonContainer.innerHTML = "";
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
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
                      className={`flex items-center gap-2.5 p-3 sm:p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                        role === "candidate"
                          ? "border-[#BB1919] bg-[#FDE8E8] shadow-soft"
                          : "border-gray-200 hover:border-[#E57373] hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="candidate"
                        checked={role === "candidate"}
                        onChange={() => setRole("candidate")}
                        className="w-4 h-4 text-[#AD1717] focus:ring-[#BB1919] cursor-pointer"
                      />
                      <span className="font-semibold text-sm sm:text-base text-gray-900/96">
                        Candidate
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 sm:p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                        role === "recruiter"
                          ? "border-[#BB1919] bg-[#FDE8E8] shadow-soft"
                          : "border-gray-200 hover:border-[#E57373] hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="recruiter"
                        checked={role === "recruiter"}
                        onChange={() => setRole("recruiter")}
                        className="w-4 h-4 text-[#AD1717] focus:ring-[#BB1919] cursor-pointer"
                      />
                      <span className="font-semibold text-sm sm:text-base text-gray-900/96">
                        Recruiter
                      </span>
                    </label>
                  </div>
                </div>

                {/* Terms & Conditions Checkbox */}
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-[#AD1717] focus:ring-[#8F1212] border-gray-200 rounded cursor-pointer"
                    required
                  />
                  <label
                    htmlFor="terms-checkbox"
                    className="text-xs sm:text-sm text-gray-500/96 font-medium cursor-pointer leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-[#AD1717] hover:text-[#8F1212] hover:underline font-medium"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-[#AD1717] hover:text-[#8F1212] hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>{" "}
                    of Jobion.
                  </label>
                </div>

                <div
                  id="google-login-btn"
                  className="flex justify-center"
                ></div>

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
