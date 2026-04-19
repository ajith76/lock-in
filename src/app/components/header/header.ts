import { Component, inject } from '@angular/core';
import { HabitService } from '../../services/habit.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly habitService = inject(HabitService);
  protected readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
