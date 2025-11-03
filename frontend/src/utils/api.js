import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // --- FIX: Use a single, generic token name for all users ---
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid token. Logging out...");
      // --- FIX: Use the same generic token name ---
      localStorage.removeItem("authToken");
      // Redirect to the generic login page, not a specific one
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
