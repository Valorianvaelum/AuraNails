import axios from "axios";

import { clearSession, getAccessToken, getRefreshToken, saveAccessToken } from "./session.js";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8001/api").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

let sessionExpiredHandler = () => {};

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
  return () => {
    sessionExpiredHandler = () => {};
  };
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/auth/login/") || originalRequest?.url?.includes("/auth/refresh/");

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      sessionExpiredHandler();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/refresh/`, { refresh: refreshToken });
      saveAccessToken(response.data.access);
      originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSession();
      sessionExpiredHandler();
      return Promise.reject(refreshError);
    }
  },
);
