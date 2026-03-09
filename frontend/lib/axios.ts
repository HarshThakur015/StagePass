import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create a custom axios instance
export const api = axios.create({
    baseURL: API_URL,
});

// Setup Request Interceptor
// Attaches the access token from cookies if it exists
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get("accessToken");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Setup Response Interceptor
// Automatically attempts to refresh the token if an API request fails with 401 Unauthorized
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) and we haven't already retried this exact request
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, put the request into the queue
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = "Bearer " + token;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = Cookies.get("refreshToken");

            if (!refreshToken) {
                // No refresh token available, force logout locally
                Cookies.remove("accessToken");
                Cookies.remove("user"); // Clear user metadata
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                // Request a new access token
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const newAccessToken = response.data.data.accessToken;

                // Remember new token
                Cookies.set("accessToken", newAccessToken);

                // Process queue with new token
                processQueue(null, newAccessToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (expired/invalid). Purge session.
                Cookies.remove("accessToken");
                Cookies.remove("refreshToken");
                Cookies.remove("user");
                processQueue(refreshError, null);
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
