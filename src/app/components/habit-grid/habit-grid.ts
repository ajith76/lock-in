import { Component, inject, computed } from '@angular/core';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-habit-grid',
  templateUrl: './habit-grid.html',
  styleUrl: './habit-grid.scss',
})
export class HabitGridComponent {
  protected readonly svc = inject(HabitService);

  protected readonly todayDay = computed(() => {
    const now = new Date();
    if (this.svc.isCurrentMonth()) {
      return now.getDate();
    }
    return -1;
  });

  protected isCompleted(habitId: string, day: number): boolean {
    return this.svc.isCompleted(habitId, day);
  }

  protected toggleDay(habitId: string, day: number): void {
    this.svc.toggleCompletion(habitId, day);
  }

  protected getHabitCompletionCount(habitId: string): number {
    const completions = this.svc.completions();
    const days = this.svc.daysArray();
    const year = this.svc.selectedYear();
    const month = this.svc.selectedMonth();
    let count = 0;
    for (const day of days) {
      const key = this.svc.makeDateKey(year, month, day);
      if (completions[habitId]?.[key]) {
        count++;
      }
    }
    return count;
  }
}
