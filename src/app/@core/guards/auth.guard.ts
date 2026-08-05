import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Access token expired (e.g. tab was minimized past its short lifespan) but the
  // refresh token is still good — refresh silently instead of forcing a re-login.
  if (authService.hasValidRefreshToken()) {
    return authService.refreshToken().pipe(
      map((response) => (response.hasError ? router.parseUrl('/login') : true)),
      catchError(() => of(router.parseUrl('/login'))),
    );
  }

  return router.parseUrl('/login');
};
