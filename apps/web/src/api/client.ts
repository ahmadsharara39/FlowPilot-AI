import axios from "axios";

const TOKEN_KEY = "flowpilot_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// In dev we default to "/api" and rely on the Vite proxy (see vite.config.ts).
// In production set VITE_API_BASE_URL to the deployed backend, e.g.
//   https://flowpilot-api.onrender.com/api
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
export const API_BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/+$/, "") : "/api";

/** Absolute webhook URL to display/copy in the UI. */
export function webhookUrl(token: string): string {
  if (API_BASE_URL.startsWith("http")) {
    return `${API_BASE_URL}/webhooks/${token}`;
  }
  return `${window.location.origin}/api/webhooks/${token}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // On auth failure, drop the token so the app redirects to login.
    if (error?.response?.status === 401 && getToken()) {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return fallback;
}
