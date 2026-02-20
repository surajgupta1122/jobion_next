import axios from "axios";

/**
 * Axios Instance
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || process.env.VITE_API_BASE || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
