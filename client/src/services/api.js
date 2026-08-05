import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://serviceflow-s6en.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Add the JWT to every authenticated request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("serviceflow_access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Remove expired or invalid authentication data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("serviceflow_access_token");
      localStorage.removeItem("serviceflow_user");
    }

    return Promise.reject(error);
  },
);

export default api;