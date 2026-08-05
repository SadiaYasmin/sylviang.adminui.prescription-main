import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function routeWithRoles(roles?: string[]): ActivatedRouteSnapshot {
    return { data: { roles } } as unknown as ActivatedRouteSnapshot;
  }

  it('should allow activation when no roles are required', () => {
    const result = TestBed.runInInjectionContext(() => roleGuard(routeWithRoles(undefined), {} as any));

    expect(result).toBeTrue();
  });

  it('should allow activation when the user has a required role', () => {
    authServiceSpy.getRole.and.returnValue('Admin');

    const result = TestBed.runInInjectionContext(() => roleGuard(routeWithRoles(['Admin']), {} as any));

    expect(result).toBeTrue();
  });

  it('should redirect to /dashboard when the user lacks a required role', () => {
    authServiceSpy.getRole.and.returnValue('Doctor');
    const urlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => roleGuard(routeWithRoles(['Admin']), {} as any));

    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dashboard');
    expect(result).toBe(urlTree);
  });

  it('should redirect to /dashboard when there is no logged-in role', () => {
    authServiceSpy.getRole.and.returnValue(null);
    const urlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => roleGuard(routeWithRoles(['Admin']), {} as any));

    expect(result).toBe(urlTree);
  });
});
