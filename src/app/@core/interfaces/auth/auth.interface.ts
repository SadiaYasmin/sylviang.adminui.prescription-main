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
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'Admin' | 'Doctor' | 'Staff';
}

export interface ICreateUserAccountResponse {
  userId: number;
  username: string;
  temporaryPassword: string;
}

export interface IResetPasswordResponse {
  temporaryPassword: string;
}

export interface ICurrentUser {
  username: string;
  role: string;
}
