export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  username: string;
  role: string;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ICreateUserAccountRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'Admin' | 'Doctor' | 'Staff';
}

export interface ICreateUserAccountResponse {
  userId: number;
  username: string;
}

export interface ICurrentUser {
  username: string;
  role: string;
}

/** GET /auth/me — the shared My Profile page's identity header, any authenticated role. */
export interface ICurrentUserDetails {
  userId: number;
  username: string;
  email: string | null;
  role: string;
}

// ===== Forgot password (anonymous, OTP) =====

export interface IForgotPasswordRequest {
  email: string;
}

export interface IVerifyForgotPasswordOtpRequest {
  email: string;
  code: string;
}

export interface IVerifyForgotPasswordOtpResponse {
  valid: boolean;
}

export interface IResetPasswordWithOtpRequest {
  email: string;
  code: string;
  newPassword: string;
}

// ===== Self-service change email / password (logged in, verify-before-apply) =====

export interface IRequestEmailChangeRequest {
  newEmail: string;
}

export interface IConfirmEmailChangeRequest {
  code: string;
}

export interface IConfirmPasswordChangeRequest {
  code: string;
  newPassword: string;
}
