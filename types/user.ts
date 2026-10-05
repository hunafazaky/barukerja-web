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

// Shape returned by POST /api/users/signin and /signup: the access token plus
// the user. POST /api/users/refresh returns ONLY { accessToken } (no user), so
// `user` is optional here and the refresh path loads the profile separately.
//
// The refresh token itself is an HttpOnly cookie, invisible to JS.
export interface AuthResponse {
  accessToken: string;
  user?: User;
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
