import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types/user";

// ==================================================
// Sign in with email + password.
// Backend route: POST /api/users/signin
// ==================================================
export function signin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/users/signin", {
    method: "POST",
    body: { email, password },
  });
}

// ==================================================
// Sign up a new account.
// Backend route: POST /api/users/signup
// display_name, photo, bio are optional on the backend (role defaults to
// "seeker" there too, but we always send it explicitly from the form so
// the choice is never left to a default the user didn't make).
// ==================================================
export function signup(input: {
  email: string;
  password: string;
  display_name?: string;
  photo?: string;
  bio?: string;
  role?: "seeker" | "employer";
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/users/signup", {
    method: "POST",
    body: input,
  });
}

// ==================================================
// Sign out. Clears the refresh token cookie on the backend.
// Backend route: DELETE /api/users/signout
// ==================================================
export function signout(): Promise<{ message: string }> {
  return apiFetch("/users/signout", { method: "DELETE" });
}

// ==================================================
// Ask the backend for a new access token, using the refresh token cookie
// that the browser sends automatically (we never touch it directly in JS).
// Backend route: POST /api/users/refresh
// ==================================================
export function refreshAccessToken(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/users/refresh", { method: "POST" });
}
