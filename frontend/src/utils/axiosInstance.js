// 🛡️ Enhanced Axios Instance with Security
import axios from "axios";

// 🛡️ **Environment variables**
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// 🛡️ **Secure Axios Configuration**
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF protection
  },
});

// 🛡️ **Request Interceptor - Add Auth Token**
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching sensitive requests
    if (config.method !== 'get') {
      config.headers['X-Timestamp'] = Date.now();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🛡️ **Response Interceptor - Handle Errors & Token Refresh**
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      // Log security issues in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn("Access forbidden:", error.response.data);
      }
    }

    // Handle 429 errors (rate limited)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`Rate limited. Retry after: ${retryAfter} seconds`);
      }
    }

    return Promise.reject(error);
  }
);

// 🛡️ **CSRF Token Handling**
const getCsrfToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]');
  return token ? token.getAttribute('content') : null;
};

// Add CSRF token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export default axiosInstance;
