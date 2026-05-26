export type UserSummary = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthResponse = {
  accessToken: string;
  expiresInMinutes: number;
  user: UserSummary;
};

export type AuthErrorBody = {
  error?: string;
  errors?: string[];
};
