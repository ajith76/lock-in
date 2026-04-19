import { Component, input, output } from '@angular/core';
import { Habit } from '../../services/habit.service';

@Component({
  selector: 'app-habit-item',
  templateUrl: './habit-item.html',
  styleUrl: './habit-item.scss',
})
export class HabitItemComponent {
  readonly habit = input.required<Habit>();
  readonly nameChange = output<string>();
  readonly delete = output<void>();

  onNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nameChange.emit(target.value);
  }
}
