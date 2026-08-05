import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { of } from 'rxjs';
import { ToastService } from '../services/misc/toast.service';
import { ErrorHandlerInterceptor } from './error-handler.interceptor';

describe('ErrorHandlerInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'clearSession', 'hasValidRefreshToken', 'refreshToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error', 'success']);
    authServiceSpy.hasValidRefreshToken.and.returnValue(false);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorHandlerInterceptor, multi: true },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should clear the session and redirect to /login on 401 when previously authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    httpClient.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush({ decentMessage: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not redirect on 401 for an already-unauthenticated request (e.g. a failed login itself)', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    httpClient.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush({ decentMessage: 'Invalid username or password.' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should not redirect on 403 (forbidden is not an expired session)', () => {
    httpClient.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush({ decentMessage: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should silently refresh and replay the request on 401 when a valid refresh token exists', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasValidRefreshToken.and.returnValue(true);
    authServiceSpy.refreshToken.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 300 } }) as any,
    );

    let result: unknown;
    httpClient.get('/api/test').subscribe({ next: (r) => (result = r) });

    const firstReq = httpMock.expectOne('/api/test');
    firstReq.flush({ decentMessage: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });

    const retriedReq = httpMock.expectOne('/api/test');
    expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-access');
    retriedReq.flush({ hasError: false, decentMessage: 'ok', content: 'payload' });

    expect(result).toEqual({ hasError: false, decentMessage: 'ok', content: 'payload' });
    expect(authServiceSpy.clearSession).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should clear the session and redirect on 401 when the refresh token is also invalid/expired', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasValidRefreshToken.and.returnValue(false);

    httpClient.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush({ decentMessage: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not attempt a refresh loop when /auth/refresh itself returns 401', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.hasValidRefreshToken.and.returnValue(true);

    httpClient.post('/prescription/auth/refresh', {}).subscribe({ error: () => {} });
    const req = httpMock.expectOne('/prescription/auth/refresh');
    req.flush({ decentMessage: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    expect(authServiceSpy.clearSession).toHaveBeenCalled();
  });
});
