import axios from "axios";

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
  saveRefreshToken,
} from "./session.js";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8001/api").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

let sessionExpiredHandler = () => {};
let refreshPromise = null;

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
  return () => {
    sessionExpiredHandler = () => {};
  };
}

function expireSession() {
  clearSession();
  sessionExpiredHandler();
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No hay un refresh token disponible.");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiBaseUrl}/auth/refresh/`, { refresh: refreshToken })
      .then(({ data }) => {
        saveAccessToken(data.access);
        if (data.refresh) saveRefreshToken(data.refresh);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
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

    if (!getRefreshToken()) {
      expireSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      expireSession();
      return Promise.reject(refreshError);
    }
  },
);
