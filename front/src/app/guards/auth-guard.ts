import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const routter = inject(Router);
  return auth.isLoggedIn() ? true : routter.createUrlTree(['/login']);
};

export const roleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn() && roles.includes(auth.role()!)) return true;
    return router.createUrlTree(['/']);
  };
};
