import axios from "axios";

import type { AuthErrorBody, AuthResponse, UserSummary } from "@/lib/auth-types";
import { api } from "@/lib/api";
import { clearStoredToken, setStoredToken } from "@/lib/auth-storage";

export type { AuthResponse, UserSummary } from "@/lib/auth-types";

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError<AuthErrorBody>(error)) {
    if (!error.response) {
      return "Cannot reach the API. Start the backend on port 5147.";
    }
    const data = error.response.data;
    if (data?.errors?.length) {
      return data.errors.join(" ");
    }
    if (data?.error) {
      return data.error;
    }
    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }
  }
  return "Something went wrong. Please try again.";
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/register", {
    email,
    password,
    fullName,
  });
  setStoredToken(data.accessToken);
  return data;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  setStoredToken(data.accessToken);
  return data;
}

export async function fetchCurrentUser(): Promise<UserSummary> {
  const { data } = await api.get<UserSummary>("/api/auth/me");
  return data;
}

export function logoutUser(): void {
  clearStoredToken();
}
