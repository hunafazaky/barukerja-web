import { apiFetch } from "@/lib/api";
import { User } from "@/types/user";

// ==================================================
// Get a single user's public profile by id.
// Backend route: GET /api/users/:id (public, no sign-in required)
//
// We use this right after signing in/up/refreshing, since those auth
// endpoints only return an access token — not the full user profile.
// See AuthContext.tsx for how the two are combined.
// ==================================================
export function getUserById(id: string): Promise<User> {
  return apiFetch<User>(`/users/${id}`);
}

// ==================================================
// Update the signed-in user's own profile.
// Backend route: PATCH /api/users/:id (requires sign-in, own account only).
// Changing `password` (or `email`) also requires `currentPassword`.
// ==================================================
export function updateUser(
  id: string,
  input: {
    display_name?: string;
    bio?: string;
    password?: string;
    currentPassword?: string;
  },
  accessToken: string,
): Promise<{ message: string; user: User }> {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: input,
    accessToken,
  });
}

// ==================================================
// Permanently delete the signed-in user's own account (and, for employers,
// their jobs). Backend route: DELETE /api/users/:id. Clears the refresh cookie.
// ==================================================
export function deleteUser(
  id: string,
  accessToken: string,
): Promise<{ message: string }> {
  return apiFetch(`/users/${id}`, { method: "DELETE", accessToken });
}
