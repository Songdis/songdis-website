import { request, setToken, removeToken, getToken } from "./core";


export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type?: string;
  created_at?: string;
  avatar_url?: string;
}

export interface AuthSuccessResponse {
  token: string;
  message?: string;
  user: AuthUser;
}

export interface ArtistProfile {
  id: number;
  full_name?: string;
  stage_name?: string;
  dob?: string;
  phone?: string;
  location?: string;
  bio?: string;
  twitter_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  spotify_url?: string;
  apple_music_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  profile_image?: string;
  spotify_image_url?: string;
}

export interface ProfileResponse {
  status: string;
  profiles: ArtistProfile[];
}


export async function signUp(payload: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}) {
  const [first_name, ...rest] = payload.fullName.trim().split(" ");
  const last_name = rest.join(" ") || first_name;

  return request<AuthSuccessResponse>("/register", {
    method: "POST",
    body: JSON.stringify({
      first_name,
      last_name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.confirmPassword,
      ...(payload.referralCode ? { referral_code: payload.referralCode } : {}),
    }),
  });
}


export async function signIn(payload: LoginPayload) {
  const res = await request<AuthSuccessResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.data?.token) {
    setToken(res.data.token);
  }


  if (res.data?.user) {
    try {
      sessionStorage.setItem("songdis_user", JSON.stringify(res.data.user));
    } catch {}
  }

  return res;
}


export async function forgotPassword(payload: ForgotPasswordPayload) {
  return request<{ message: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function resetPassword(payload: {
  email: string;
  otp: string;       
  newPassword: string;
  confirmPassword: string;
}) {
  return request<{ message: string }>("/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      token: payload.otp,
      password: payload.newPassword,
      password_confirmation: payload.confirmPassword,
    }),
  });
}


export async function getUser() {
  return request<AuthUser>("/user", { method: "GET" }, true);
}


export async function getProfile() {
  return request<ProfileResponse>("/profile", { method: "GET" }, true);
}

export interface CreateProfilePayload {
  full_name: string;
  stage_name: string;
  dob: string;
  location: string;
  phone: string;
  country_code: string;
  twitter_url: string;
  instagram_url: string;
  facebook_url: string;
  spotify_url: string;
  apple_music_url: string;
  tiktok_url: string;
  youtube_url: string;
}


export async function createProfile(payload: CreateProfilePayload) {
  return request<ArtistProfile>("/create-profile", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}


export async function updateProfile(id: number, payload: CreateProfilePayload) {
  return request<ArtistProfile>(`/profile/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, true);
}

export interface SpotifyArtist {
  spotify_id: string;
  name: string;
  image_url: string;
  followers: number;
  popularity: number;
  genres: string[];
  spotify_url: string;
}


export async function searchSpotifyArtists(query: string) {
  return request<{ artists: SpotifyArtist[] }>(`/search/artists?query=${encodeURIComponent(query)}`, {
    method: "GET",
  }, true);
}

/**
 * Verify a Spotify artist URL.
 */
export async function verifySpotifyUrl(spotify_url: string) {
  return request<{ status: string; artist: SpotifyArtist }>("/verify-spotify-url", {
    method: "POST",
    body: JSON.stringify({ spotify_url }),
  }, true);
}

/**
 * Change password (authenticated).
 */
export async function changePassword(payload: ChangePasswordPayload) {
  return request<{ message: string }>(
    "/change-password",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    true
  );
}

/**
 * Log out. Clears the local token regardless of server response.
 */
export async function logout() {
  const res = await request<{ message: string }>(
    "/logout",
    { method: "POST" },
    true
  );
  removeToken();
  return res;
}

/**
 * Check if the user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}


export async function verifyOtp(payload: { email: string; otp: string }) {
  return request<{ message: string }>("/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function resendOtp(email: string) {
  return request<{ message: string }>("/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}


export async function getGoogleAuthUrl() {
  return request<{ url: string }>("/auth/google/redirect", { method: "GET" });
}

export { getToken, setToken, removeToken };