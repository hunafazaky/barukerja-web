// This matches what the backend returns for a User document.
// See backend: app/models/user.model.js (toJSON transform turns _id into id,
// and always strips the password field before sending it to the client).
export type UserRole = "seeker" | "employer" | "admin";

export interface User {
  id: string;
  email: string;
  display_name: string;
  photo: string;
  bio: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by POST /api/users/signin, POST /api/users/signup, and
// POST /api/users/refresh.
//
// Confirmed from the real API response: it's ONLY the access token —
// no user object included. (We originally assumed { accessToken, user },
// which caused a bug where the signed-in user would "disappear" after a
// page refresh — see AuthContext.tsx for how we now load the user
// separately.)
//
// The backend also sets a refresh token as an HttpOnly cookie, but that
// cookie is invisible to our JavaScript code (which is the point of it
// being HttpOnly — it protects the refresh token from XSS attacks).
export interface AuthResponse {
  accessToken: string;
}

// The data we can decode directly out of the JWT access token itself,
// without any extra API call. See backend: app/utils/jwtHelper.js —
// generateAccessToken() signs exactly these fields into the token.
export interface JwtPayload {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  iat: number;
  exp: number;
}
