import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    this.loading.set(true);

    try {
      await this.auth.register(this.email(), this.name(), this.password());
      this.router.navigate(['/']);
    } catch (err) {
      this.error.set(typeof err === 'string' ? err : 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }
}
