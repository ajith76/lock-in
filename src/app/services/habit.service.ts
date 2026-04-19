import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ApiService, HabitCompletion } from './api.service';
import { AuthService } from './auth.service';

export interface Habit {
  id: string;
  name: string;
  createdAt: string;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  // ── Core state signals ──
  readonly habits = signal<Habit[]>([]);
  readonly completions = signal<HabitCompletion>({});
  readonly selectedMonth = signal(new Date().getMonth());
  readonly selectedYear = signal(new Date().getFullYear());

  // ── Derived signals ──
  readonly monthLabel = computed(() => {
    const date = new Date(this.selectedYear(), this.selectedMonth());
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  readonly daysInMonth = computed(() => {
    return new Date(this.selectedYear(), this.selectedMonth() + 1, 0).getDate();
  });

  readonly daysArray = computed(() => {
    const count = this.daysInMonth();
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  readonly todayKey = computed(() => {
    const now = new Date();
    return this.makeDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  });

  readonly isCurrentMonth = computed(() => {
    const now = new Date();
    return this.selectedMonth() === now.getMonth() && this.selectedYear() === now.getFullYear();
  });

  /** For each day of the selected month, count how many habits were completed */
  readonly dailyCompletionCounts = computed(() => {
    const days = this.daysArray();
    const comps = this.completions();
    const habits = this.habits();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    return days.map(day => {
      const key = this.makeDateKey(year, month, day);
      let count = 0;
      for (const habit of habits) {
        if (comps[habit.id]?.[key]) {
          count++;
        }
      }
      return count;
    });
  });

  readonly totalCompletions = computed(() => {
    return this.dailyCompletionCounts().reduce((sum, c) => sum + c, 0);
  });

  readonly totalPossible = computed(() => {
    const habitCount = this.habits().length;
    if (habitCount === 0) return 0;

    // If current month, only count up to today
    if (this.isCurrentMonth()) {
      const today = new Date().getDate();
      return habitCount * today;
    }
    return habitCount * this.daysInMonth();
  });

  readonly completionRate = computed(() => {
    const possible = this.totalPossible();
    if (possible === 0) return 0;
    return Math.round((this.totalCompletions() / possible) * 100);
  });

  readonly dailyAverage = computed(() => {
    const counts = this.dailyCompletionCounts();
    let activeDays: number;

    if (this.isCurrentMonth()) {
      activeDays = new Date().getDate();
    } else {
      activeDays = this.daysInMonth();
    }

    if (activeDays === 0) return 0;

    const total = counts.slice(0, activeDays).reduce((s, c) => s + c, 0);
    return Math.round((total / activeDays) * 10) / 10;
  });

  readonly bestStreak = computed(() => {
    const counts = this.dailyCompletionCounts();
    let maxStreak = 0;
    let currentStreak = 0;

    const limit = this.isCurrentMonth() ? new Date().getDate() : this.daysInMonth();

    for (let i = 0; i < limit; i++) {
      if (counts[i] > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  });

  constructor() {
    // Load habits when authenticated
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadHabits();
      } else {
        this.habits.set([]);
        this.completions.set({});
      }
    });

    // Load completions when month/year changes or habits change
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadCompletions();
      }
    });
  }

  // ── Actions ──

  loadHabits(): void {
    this.api.getHabits().subscribe({
      next: (res) => this.habits.set(res.habits),
      error: (err) => console.error('Failed to load habits', err),
    });
  }

  loadCompletions(): void {
    // We use month + 1 because the API expects 1-12
    this.api.getCompletions(this.selectedMonth() + 1, this.selectedYear()).subscribe({
      next: (res) => this.completions.set(res.completions),
      error: (err) => console.error('Failed to load completions', err),
    });
  }

  addHabit(name = ''): void {
    this.api.createHabit(name).subscribe({
      next: (res) => this.habits.update(h => [...h, res.habit]),
      error: (err) => console.error('Failed to add habit', err),
    });
  }

  removeHabit(id: string): void {
    this.api.deleteHabit(id).subscribe({
      next: () => {
        this.habits.update(list => list.filter(h => h.id !== id));
        this.completions.update(comps => {
          const copy = { ...comps };
          delete copy[id];
          return copy;
        });
      },
      error: (err) => console.error('Failed to remove habit', err),
    });
  }

  updateHabitName(id: string, name: string): void {
    this.api.updateHabit(id, { name }).subscribe({
      next: (res) => {
        this.habits.update(list =>
          list.map(h => (h.id === id ? { ...h, name: res.habit.name } : h))
        );
      },
      error: (err) => console.error('Failed to update habit name', err),
    });
  }

  toggleCompletion(habitId: string, day: number): void {
    const key = this.makeDateKey(this.selectedYear(), this.selectedMonth(), day);
    this.api.toggleCompletion(habitId, key).subscribe({
      next: (res) => {
        this.completions.update(comps => {
          const habitComps = { ...(comps[habitId] ?? {}) };
          if (res.completed) {
            habitComps[key] = true;
          } else {
            delete habitComps[key];
          }
          return {
            ...comps,
            [habitId]: habitComps,
          };
        });
      },
      error: (err) => console.error('Failed to toggle completion', err),
    });
  }

  isCompleted(habitId: string, day: number): boolean {
    const key = this.makeDateKey(this.selectedYear(), this.selectedMonth(), day);
    return this.completions()[habitId]?.[key] ?? false;
  }

  navigateMonth(delta: number): void {
    let month = this.selectedMonth() + delta;
    let year = this.selectedYear();

    if (month < 0) {
      month = 11;
      year--;
    } else if (month > 11) {
      month = 0;
      year++;
    }

    this.selectedMonth.set(month);
    this.selectedYear.set(year);
  }

  // ── Helpers ──

  makeDateKey(year: number, month: number, day: number): string {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }
}
