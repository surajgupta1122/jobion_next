"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../components/apiconfig/apiconfig";

export default function SignUp() {
  // Use "candidate" as the default/normal user role
  const [role, setRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const handleGoogleSuccessRef = useRef(null);

  // GOOGLE SIGNUP
  const handleGoogleSuccess = useCallback(async (response) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Map role: "user" -> "candidate" for backend, "recruiter" -> "recruiter"
      const roleToSend = role === "recruiter" ? "recruiter" : "candidate";

      const { data } = await api.post("/auth/google", {
        credential: response.credential,
        role: roleToSend
      });

      const userRole = data?.user?.role || roleToSend;

      window.location.href = userRole === "recruiter"
        ? "/recruiter-profile"
        : "/dashboard";

    } catch (err) {
      setError(err?.response?.data?.message || "Google signup failed");
    } finally {
      setLoading(false);
    }
  }, [role]);

  // Keep ref updated
  useEffect(() => {
    handleGoogleSuccessRef.current = handleGoogleSuccess;
  }, [handleGoogleSuccess]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing. Please set it in your .env file.");
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
          callback: (response) => {
            if (handleGoogleSuccessRef.current) {
              handleGoogleSuccessRef.current(response);
            }
          },
        });

        const buttonContainer = document.getElementById("google-signup-btn");
        if (buttonContainer) {
          buttonContainer.innerHTML = "";
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
          });
        }
      } catch (err) {
        console.error("Error initializing Google auth:", err);
      }
    };

    // Start initialization
    initializeGoogleAuth();
  }, [role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-6xl rounded-2xl bg-[#eefcfb] p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          <div className="px-4 md:px-8">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-800">
              Move your career forward with faster hiring and better pay
            </h1>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-2xl shadow-lg bg-white border border-gray-200">
              <div className="px-8 pt-8 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-semibold">Create Your Account</h2>
                <p className="mt-1 text-sm text-slate-500">Sign up with Google</p>
              </div>

              <div className="px-8 pb-8 space-y-4 pt-6">
                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    I want to sign up as:
                  </label>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <label className={`flex gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${role === "candidate" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <input
                        type="radio"
                        name="role"
                        value="candidate"
                        checked={role === "candidate"}
                        onChange={() => setRole("candidate")}
                        className="mt-0.5"
                      />
                      <span className="font-medium">Candidate</span>
                    </label>

                    <label className={`flex gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${role === "recruiter" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <input
                        type="radio"
                        name="role"
                        value="recruiter"
                        checked={role === "recruiter"}
                        onChange={() => setRole("recruiter")}
                        className="mt-0.5"
                      />
                      <span className="font-medium">Recruiter</span>
                    </label>
                  </div>
                </div>

                <div id="google-signup-btn" className="flex justify-center"></div>

                {message && <p className="text-green-600 text-sm text-center">{message}</p>}
                {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                <p className="text-sm text-center">
                  Already have an account? <a className="text-slate-800 hover:underline" href="/sign-in">Sign In</a>
                </p>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
