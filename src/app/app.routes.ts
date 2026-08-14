import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    // Public verification page (US-035) — deliberately a sibling of the guarded '' branch
    // below, not nested under it, so it never sits behind authGuard or the Shell chrome.
    path: 'verify',
    loadChildren: () => import('./verify/verify.module').then((m) => m.VerifyModule),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/pages.module').then((m) => m.PagesModule),
  },
  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },
];
