import axios from "axios";

/**
 * Axios Instance
 */
const api = axios.create({
  // Default to Next.js serverless API routes unless overridden via env
  // (useful when the frontend is served separately)
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE || process.env.VITE_API_BASE || "/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
