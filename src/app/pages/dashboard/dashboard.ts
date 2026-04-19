import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../components/header/header';
import { HabitListComponent } from '../../components/habit-list/habit-list';
import { HabitGridComponent } from '../../components/habit-grid/habit-grid';
import { ChartComponent } from '../../components/chart/chart';
import { StatsComponent } from '../../components/stats/stats';

@Component({
  selector: 'app-dashboard',
  imports: [
    HeaderComponent,
    HabitListComponent,
    HabitGridComponent,
    ChartComponent,
    StatsComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {}
