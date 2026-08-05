import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasValidRefreshToken', 'refreshToken']);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should allow activation when authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBeTrue();
  });

  it('should redirect to /login when not authenticated and there is no valid refresh token', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.hasValidRefreshToken.and.returnValue(false);
    const urlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(urlTree);
  });

  it('should silently refresh and allow activation when the access token expired but the refresh token is still valid', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.hasValidRefreshToken.and.returnValue(true);
    authServiceSpy.refreshToken.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 300 } }) as any,
    );

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    (result as any).subscribe((activated: boolean) => {
      expect(activated).toBeTrue();
      done();
    });
  });

  it('should redirect to /login when the silent refresh itself fails', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.hasValidRefreshToken.and.returnValue(true);
    authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));
    const urlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    (result as any).subscribe((activated: UrlTree) => {
      expect(activated).toBe(urlTree);
      done();
    });
  });
});
