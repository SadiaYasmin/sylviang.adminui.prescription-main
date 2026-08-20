import { HttpContextToken } from '@angular/common/http';

export const DISABLE_TOAST = new HttpContextToken<boolean>(() => false);

// Opt-in only. Defaulting this to `true` (as it was before) meant the interceptor auto-showed
// a generic backend toast ("Request processed successfully.") on every single successful
// POST/PUT/DELETE — but no call in the app ever actually opts in explicitly, since almost
// every component already shows its own specific toast (e.g. "Doctor updated successfully.").
// The result was every mutating action showing two stacked toasts. Nothing currently sets
// this to `true`, so flipping the default to `false` removes the redundant generic toast
// everywhere at once without touching the many components that already have their own.
export const SHOW_SUCCESS_TOAST = new HttpContextToken<boolean>(() => false);
