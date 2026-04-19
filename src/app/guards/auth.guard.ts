import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // If still loading, wait a bit
  if (auth.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(interval);
          if (auth.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(interval);
        if (!auth.isAuthenticated()) {
          router.navigate(['/login']);
          resolve(false);
        }
      }, 5000);
    });
  }

  router.navigate(['/login']);
  return false;
};
