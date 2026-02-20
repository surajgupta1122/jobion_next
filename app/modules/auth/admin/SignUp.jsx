"use client";
import { useState } from "react";
import api from "../../../components/apiconfig/apiconfig";

export default function AdminSignUp() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return ""; // Phone is optional
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) return "Please enter a valid 10-digit Indian mobile number (starting with 6-9)";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (password.length > 128) return "Password must be less than 128 characters";
    return "";
  };

  const validateFullName = (name) => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Full name must be at least 2 characters";
    if (name.trim().length > 100) return "Full name must be less than 100 characters";
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) return "Full name can only contain letters, spaces, hyphens, and apostrophes";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "full_name":
        error = validateFullName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        error = validatePhone(value);
        break;
      case "password":
        error = validatePassword(value);
        // Also re-validate confirmPassword if it's been touched
        if (fieldTouched.confirmPassword) {
          const confirmError = validateConfirmPassword(formData.confirmPassword, value);
          setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value, formData.password);
        break;
      default:
        break;
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear general error when user types
    if (error) setError("");
    // Validate field if it has been touched
    if (fieldTouched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Validate all fields before submission
    const allFields = ["full_name", "email", "password", "confirmPassword"];
    allFields.forEach(field => {
      setFieldTouched(prev => ({ ...prev, [field]: true }));
      validateField(field, formData[field]);
    });

    // Also validate phone if provided
    if (formData.phone) {
      setFieldTouched(prev => ({ ...prev, phone: true }));
      validateField("phone", formData.phone);
    }

    // Check if there are any errors
    const hasErrors = Object.values(fieldErrors).some(err => err !== "") ||
      validateFullName(formData.full_name) !== "" ||
      validateEmail(formData.email) !== "" ||
      validatePassword(formData.password) !== "" ||
      validateConfirmPassword(formData.confirmPassword, formData.password) !== "" ||
      (formData.phone && validatePhone(formData.phone) !== "");

    if (hasErrors) {
      setError("Please correct the errors below before submitting");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/admin/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      setMessage(data?.message || "Admin registered successfully");
      
      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
      
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Admin registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobion Admin</h1>
          <p className="text-gray-600">Create your admin account</p>
        </div>

        <div className="w-full rounded-xl shadow-xl border-0 bg-white">
          <div className="px-8 pt-8 pb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Admin Registration</h2>
            <p className="mt-2 text-sm text-gray-500">Fill in your details to create an admin account</p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    name="full_name"
                    className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 transition-colors outline-none ${
                      fieldErrors.full_name && fieldTouched.full_name
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {fieldErrors.full_name && fieldTouched.full_name && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.full_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    name="email"
                    className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 transition-colors outline-none ${
                      fieldErrors.email && fieldTouched.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="admin@jobion.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {fieldErrors.email && fieldTouched.email && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 transition-colors outline-none ${
                      fieldErrors.phone && fieldTouched.phone
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="9876543210"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleChange({ target: { name: 'phone', value } });
                      }
                    }}
                    onBlur={handleBlur}
                    maxLength="10"
                  />
                  {fieldErrors.phone && fieldTouched.phone && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
                  )}
                  {!fieldErrors.phone && fieldTouched.phone && (
                    <p className="text-xs text-gray-500 mt-1">10-digit Indian mobile number (optional)</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    name="password"
                    className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 transition-colors outline-none ${
                      fieldErrors.password && fieldTouched.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="Create a strong password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {fieldErrors.password && fieldTouched.password ? (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    name="confirmPassword"
                    className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 transition-colors outline-none ${
                      fieldErrors.confirmPassword && fieldTouched.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="Confirm your password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {fieldErrors.confirmPassword && fieldTouched.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-3 text-white font-semibold shadow-lg bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>

            {/* Messages */}
            {message && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-700 text-sm font-medium">{message}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an admin account?{" "}
                <a 
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors" 
                  href="/admin/signin"
                >
                  Sign in here
                </a>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Regular user registration?{" "}
                <a 
                  className="font-medium text-gray-700 hover:text-gray-900 hover:underline transition-colors" 
                  href="/sign-up"
                >
                  Sign up here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2024 Jobion Admin. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

