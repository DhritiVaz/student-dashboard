import axios, { AxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";
import { useToastStore } from "../stores/toastStore";

export function toErrorString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const msgs = (Object.values(raw).flat().filter(Boolean) as string[]).join(" ");
    return msgs || "Something went wrong.";
  }
  return "Something went wrong.";
}

function handleApiError(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { error?: unknown } } })?.response;
  const status = response?.status;
  const addToast = useToastStore.getState().addToast;

  // Network error (no response)
  if (!response) {
    addToast("error", "Connection error. Check your internet.");
    return;
  }

  switch (status) {
    case 401:
      // Handled by interceptor; will toast + redirect after logout
      break;
    case 403:
      addToast("error", "You don't have permission to do that.");
      break;
    case 404:
      addToast("error", "Item not found.");
      break;
    case 500:
    default:
      if (status && status >= 500) {
        addToast("error", toErrorString(response?.data?.error) || "Server error. Please try again later.");
      }
      break;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: refresh-and-retry on 401 ───────────────────────────
let isRefreshing = false;
// Queue of resolvers waiting on the refresh to complete
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(newToken: string) {
  refreshQueue.forEach((resolve) => resolve(newToken));
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: (AxiosRequestConfig & { _retry?: boolean }) | undefined = error?.config;
    const isAuthEndpoint =
      original?.url && (String(original.url).includes("/auth/login") || String(original.url).includes("/auth/register"));

    // 401 on login/register = invalid credentials; reject and let form show error (no redirect)
    if (isAuthEndpoint && error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Non-401: handle error toast (skip for auth endpoints — form handles it), then reject
    if (error.response?.status !== 401) {
      if (!isAuthEndpoint) handleApiError(error);
      return Promise.reject(error);
    }

    // Cannot retry without request config
    if (!original) return Promise.reject(error);

    // 401 that was already retried: refresh failed → logout, toast, redirect
    if (original._retry) {
      const { logout } = useAuthStore.getState();
      logout();
      useToastStore.getState().addToast("error", "Session expired, please log in again.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      useToastStore.getState().addToast("error", "Session expired, please log in again.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it to finish
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL ?? "/api"}/auth/refresh`,
        { refreshToken }
      );
      const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
      setTokens(newAccess, newRefresh);
      processQueue(newAccess);
      original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
      return api(original);
    } catch {
      logout();
      refreshQueue = [];
      useToastStore.getState().addToast("error", "Session expired, please log in again.");
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
