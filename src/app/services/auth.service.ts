import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, ApiUser } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly currentUser = signal<ApiUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = signal(true);

  /** Check if user is logged in (called on app init) */
  checkAuth(): void {
    this.isLoading.set(true);
    this.api.getMe().subscribe({
      next: (res) => {
        this.currentUser.set(res.user);
        this.isLoading.set(false);
      },
      error: () => {
        // Try refresh token
        this.api.refresh().subscribe({
          next: (res) => {
            this.currentUser.set(res.user);
            this.isLoading.set(false);
          },
          error: () => {
            this.currentUser.set(null);
            this.isLoading.set(false);
          },
        });
      },
    });
  }

  login(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.login(email, password).subscribe({
        next: (res) => {
          this.currentUser.set(res.user);
          resolve();
        },
        error: (err) => {
          reject(err.error?.error ?? 'Login failed');
        },
      });
    });
  }

  register(email: string, name: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.register(email, name, password).subscribe({
        next: (res) => {
          this.currentUser.set(res.user);
          resolve();
        },
        error: (err) => {
          reject(err.error?.error ?? 'Registration failed');
        },
      });
    });
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
    });
  }
}
