import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiHabit {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
}

export interface HabitCompletion {
  [habitId: string]: {
    [dateKey: string]: boolean;
  };
}

export interface StatsResponse {
  totalHabits: number;
  totalCompletions: number;
  completionRate: number;
  dailyAverage: number;
  bestStreak: number;
  dailyCounts: number[];
}

const BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ── Auth ──
  register(email: string, name: string, password: string): Observable<{ user: ApiUser }> {
    return this.http.post<{ user: ApiUser }>(`${BASE_URL}/auth/register`, { email, name, password }, { withCredentials: true });
  }

  login(email: string, password: string): Observable<{ user: ApiUser }> {
    return this.http.post<{ user: ApiUser }>(`${BASE_URL}/auth/login`, { email, password }, { withCredentials: true });
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
  }

  refresh(): Observable<{ user: ApiUser }> {
    return this.http.post<{ user: ApiUser }>(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
  }

  getMe(): Observable<{ user: ApiUser }> {
    return this.http.get<{ user: ApiUser }>(`${BASE_URL}/auth/me`, { withCredentials: true });
  }

  // ── Habits ──
  getHabits(): Observable<{ habits: ApiHabit[] }> {
    return this.http.get<{ habits: ApiHabit[] }>(`${BASE_URL}/habits`, { withCredentials: true });
  }

  createHabit(name = ''): Observable<{ habit: ApiHabit }> {
    return this.http.post<{ habit: ApiHabit }>(`${BASE_URL}/habits`, { name }, { withCredentials: true });
  }

  updateHabit(id: string, data: { name?: string; order?: number }): Observable<{ habit: ApiHabit }> {
    return this.http.put<{ habit: ApiHabit }>(`${BASE_URL}/habits/${id}`, data, { withCredentials: true });
  }

  deleteHabit(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${BASE_URL}/habits/${id}`, { withCredentials: true });
  }

  // ── Completions ──
  getCompletions(month: number, year: number): Observable<{ completions: HabitCompletion }> {
    return this.http.get<{ completions: HabitCompletion }>(`${BASE_URL}/completions`, {
      params: { month: month.toString(), year: year.toString() },
      withCredentials: true,
    });
  }

  toggleCompletion(habitId: string, date: string): Observable<{ completed: boolean; habitId: string; date: string }> {
    return this.http.post<{ completed: boolean; habitId: string; date: string }>(`${BASE_URL}/completions/toggle`, { habitId, date }, { withCredentials: true });
  }

  // ── Stats ──
  getStats(month: number, year: number): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${BASE_URL}/stats`, {
      params: { month: month.toString(), year: year.toString() },
      withCredentials: true,
    });
  }
}
