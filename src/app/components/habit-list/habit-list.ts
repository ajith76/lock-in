import { Component, inject } from '@angular/core';
import { HabitService } from '../../services/habit.service';
import { HabitItemComponent } from '../habit-item/habit-item';

@Component({
  selector: 'app-habit-list',
  imports: [HabitItemComponent],
  templateUrl: './habit-list.html',
  styleUrl: './habit-list.scss',
})
export class HabitListComponent {
  protected readonly svc = inject(HabitService);
}
