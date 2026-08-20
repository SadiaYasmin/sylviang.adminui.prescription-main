import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const role = authService.getRole();
  if (role && requiredRoles.includes(role)) {
    return true;
  }

  // Admin has no Dashboard (Analytics & Reports covers the same ground, without the
  // duplication) — bouncing a denied Admin to '/dashboard' would just hit this same guard
  // again there. Everyone else still lands on Dashboard.
  return router.parseUrl(role === 'Admin' ? '/analytics' : '/dashboard');
};
