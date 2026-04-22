import { TOKEN_KEY, USER_KEY } from "./constants";
import type { User } from "@/types/user";

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const storeAuth = (token: string, user: User): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => !!getStoredToken();

export const getUserInitials = (user: User | null): string => {
  if (!user) return "?";
  const f = user.firstName?.[0] ?? "";
  const l = user.lastName?.[0] ?? "";
  if (!f && !l) return (user.email?.[0] ?? "?").toUpperCase();
  return `${f}${l}`.toUpperCase();
};

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return "Guest";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email || "User";
};