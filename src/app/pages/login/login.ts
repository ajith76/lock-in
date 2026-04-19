import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    this.loading.set(true);

    try {
      await this.auth.login(this.email(), this.password());
      this.router.navigate(['/']);
    } catch (err) {
      this.error.set(typeof err === 'string' ? err : 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }
}
