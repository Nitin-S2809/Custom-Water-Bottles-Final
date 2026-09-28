export const STORAGE_KEYS = {
  user: "aquaBrandUser",
  token: "aquaBrandToken",
};

const REDIRECT_LOCK_KEY = "aquaBrandAuthRedirecting";

export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
}

export function clearAdminAuthState() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(REDIRECT_LOCK_KEY);
}

export function redirectToAdminLogin(navigate, message = "Your admin session expired. Please log in again.") {
  if (typeof window === "undefined") return;

  if (sessionStorage.getItem(REDIRECT_LOCK_KEY) === "1") {
    return;
  }

  sessionStorage.setItem(REDIRECT_LOCK_KEY, "1");
  clearAdminAuthState();

  if (navigate) {
    navigate("/admin/login", { replace: true, state: { message } });
  }

  setTimeout(() => {
    sessionStorage.removeItem(REDIRECT_LOCK_KEY);
  }, 250);
}

export async function adminFetch(url, options = {}, navigate) {
  const token = localStorage.getItem(STORAGE_KEYS.token);

  if (!token || isTokenExpired(token)) {
    redirectToAdminLogin(navigate, "Your admin session expired. Please log in again.");
    throw new Error("Admin authentication expired");
  }

  const headers = { ...(options.headers || {}) };
  if (!headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    redirectToAdminLogin(navigate, "Your admin session expired. Please log in again.");
  }

  return response;
}
