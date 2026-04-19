import { Component, inject } from '@angular/core';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class StatsComponent {
  protected readonly svc = inject(HabitService);
}
