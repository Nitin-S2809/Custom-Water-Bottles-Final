/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  user: "aquaBrandUser",
  token: "aquaBrandToken",
};

const decodeJwtPayload = (token) => {
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
};

const isJwtExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return Date.now() >= payload.exp * 1000;
};

const normalizeUser = (user) => {
  if (!user || typeof user !== "object") return null;

  const username = String(user.username || user.name || user.fullName || "User").trim() || "User";
  const firstName = username.split(/\s+/)[0] || "User";

  return {
    _id: user._id || user.id || null,
    username,
    firstName,
    email: user.email || "",
    profileImage: user.profileImage || user.avatar || "",
  };
};

const readStoredUser = () => {
  if (typeof window === "undefined") return null;

  const savedUser = localStorage.getItem(STORAGE_KEYS.user) || sessionStorage.getItem(STORAGE_KEYS.user);
  if (!savedUser) return null;

  try {
    return normalizeUser(JSON.parse(savedUser));
  } catch {
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
};

const readStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.token) || sessionStorage.getItem(STORAGE_KEYS.token) || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);

  useEffect(() => {
    if (!token) {
      if (user) {
        setUser(null);
      }
      return;
    }

    if (isJwtExpired(token)) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.token);
        sessionStorage.removeItem(STORAGE_KEYS.user);
        sessionStorage.removeItem(STORAGE_KEYS.token);
      }
      setUser(null);
      setToken(null);
    }
  }, [token, user]);

  const login = ({ user: nextUser, token: nextToken, rememberMe = true }) => {
    const normalizedUser = normalizeUser(nextUser);
    setUser(normalizedUser);
    setToken(nextToken || null);

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.token);
      sessionStorage.removeItem(STORAGE_KEYS.user);
      sessionStorage.removeItem(STORAGE_KEYS.token);

      const storage = rememberMe ? localStorage : sessionStorage;
      if (normalizedUser) {
        storage.setItem(STORAGE_KEYS.user, JSON.stringify(normalizedUser));
      }

      if (nextToken) {
        storage.setItem(STORAGE_KEYS.token, nextToken);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.token);
      sessionStorage.removeItem(STORAGE_KEYS.user);
      sessionStorage.removeItem(STORAGE_KEYS.token);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
