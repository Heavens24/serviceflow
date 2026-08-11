import axios from "axios";

const isDevelopment = import.meta.env.DEV;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (
    isDevelopment
      ? "http://127.0.0.1:5000"
      : "https://serviceflow-s6en.onrender.com"
  );

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ==========================
// Request Interceptor
// ==========================
// Attach the JWT automatically
// to authenticated API requests.
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "serviceflow_access_token",
      );

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(error),
);

// ==========================
// Response Interceptor
// ==========================
// Clear local authentication when
// the backend reports an expired or
// unauthorized session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem(
        "serviceflow_access_token",
      );

      localStorage.removeItem(
        "serviceflow_user",
      );
    }

    return Promise.reject(error);
  },
);

export default api;