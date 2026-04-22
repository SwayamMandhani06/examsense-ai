export type UserRole = "student" | "admin";

export type BtechYear = "1st" | "2nd" | "3rd" | "4th" | 1 | 2 | 3 | 4;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  btechYear?: BtechYear | null;
  phone?: string | null;
  college?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  btechYear?: BtechYear;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  tokenType: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  btechYear?: BtechYear | null;
  phone?: string | null;
  college?: string | null;
  bio?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
