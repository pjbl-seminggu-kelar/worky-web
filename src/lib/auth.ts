export const ONBOARDING_COMPLETED_KEY = "worky:onboarding-completed";
export const AUTH_TOKEN_KEY = "worky:auth-token";
export const AUTH_USER_KEY = "worky:auth-user";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  experienceLevel?: string;
  age?: number;
  weightKg?: number;
};

export type AuthResponse = {
  status: "success";
  data: {
    user: AuthUser;
    token: string;
  };
};

export function saveAuthSession(response: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
}
