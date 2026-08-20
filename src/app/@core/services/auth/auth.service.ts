import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IConfirmEmailChangeRequest,
  IConfirmPasswordChangeRequest,
  ICreateUserAccountRequest,
  ICreateUserAccountResponse,
  ICurrentUser,
  ICurrentUserDetails,
  IForgotPasswordRequest,
  ILoginRequest,
  ILoginResponse,
  IRefreshTokenResponse,
  IRequestEmailChangeRequest,
  IResetPasswordWithOtpRequest,
  IVerifyForgotPasswordOtpRequest,
  IVerifyForgotPasswordOtpResponse,
} from '@core/interfaces/auth/auth.interface';
import { BASE_URL_Auth, BASE_URL_Me } from '@env/environment';
import { BehaviorSubject, Observable, finalize, shareReplay, tap } from 'rxjs';

const ACCESS_TOKEN_KEY = 'pms_access_token';
const REFRESH_TOKEN_KEY = 'pms_refresh_token';
const USER_KEY = 'pms_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<ICurrentUser | null>(this.readStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Shared by the auth guard and the HTTP interceptor so concurrent 401s (e.g. several
  // requests firing right after the tab wakes from minimize) trigger one refresh call,
  // not a race of several — Keycloak refresh tokens are one-time-use and rotate on exchange.
  private refreshInFlight: Observable<ApiResponse<IRefreshTokenResponse>> | null = null;

  constructor(private httpClient: HttpClient) {}

  login(request: ILoginRequest): Observable<ApiResponse<ILoginResponse>> {
    return this.httpClient.post<ApiResponse<ILoginResponse>>(`${BASE_URL_Auth}/login`, request).pipe(
      tap((response) => {
        if (!response.hasError) {
          this.storeSession(response.content);
        }
      }),
    );
  }

  refreshToken(): Observable<ApiResponse<IRefreshTokenResponse>> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.getRefreshToken();
    this.refreshInFlight = this.httpClient.post<ApiResponse<IRefreshTokenResponse>>(`${BASE_URL_Auth}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        if (!response.hasError) {
          localStorage.setItem(ACCESS_TOKEN_KEY, response.content.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.content.refreshToken);
        }
      }),
      shareReplay(1),
      finalize(() => {
        this.refreshInFlight = null;
      }),
    );
    return this.refreshInFlight;
  }

  logout(): Observable<ApiResponse<void>> {
    const refreshToken = this.getRefreshToken();
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Auth}/logout`, { refreshToken }).pipe(
      tap(() => this.clearSession()),
    );
  }

  createUserAccount(request: ICreateUserAccountRequest): Observable<ApiResponse<ICreateUserAccountResponse>> {
    return this.httpClient.post<ApiResponse<ICreateUserAccountResponse>>(`${BASE_URL_Auth}/users`, request);
  }

  /** Re-sends the "set your password" invite email — no password is ever returned to the client. */
  resendAccountInvite(userId: number): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Auth}/users/${userId}/reset-password`, {});
  }

  // ===== Forgot password (anonymous, OTP) =====

  forgotPassword(request: IForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Auth}/forgot-password`, request);
  }

  verifyForgotPasswordOtp(request: IVerifyForgotPasswordOtpRequest): Observable<ApiResponse<IVerifyForgotPasswordOtpResponse>> {
    return this.httpClient.post<ApiResponse<IVerifyForgotPasswordOtpResponse>>(`${BASE_URL_Auth}/forgot-password/verify`, request);
  }

  resetPasswordWithOtp(request: IResetPasswordWithOtpRequest): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Auth}/forgot-password/reset`, request);
  }

  // ===== Self-service change email / password =====

  getCurrentUser(): Observable<ApiResponse<ICurrentUserDetails>> {
    return this.httpClient.get<ApiResponse<ICurrentUserDetails>>(`${BASE_URL_Me}`);
  }

  requestEmailChange(request: IRequestEmailChangeRequest): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Me}/email/request-change`, request);
  }

  confirmEmailChange(request: IConfirmEmailChangeRequest): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Me}/email/confirm-change`, request);
  }

  requestPasswordChange(): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Me}/password/request-change`, {});
  }

  confirmPasswordChange(request: IConfirmPasswordChangeRequest): Observable<ApiResponse<void>> {
    return this.httpClient.post<ApiResponse<void>>(`${BASE_URL_Me}/password/confirm-change`, request);
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  /** True when a (still unexpired) refresh token exists, so a silent refresh can recover the session. */
  hasValidRefreshToken(): boolean {
    const token = this.getRefreshToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  private storeSession(response: ILoginResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    const user: ICurrentUser = { username: response.username, role: response.role };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readStoredUser(): ICurrentUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as ICurrentUser) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
