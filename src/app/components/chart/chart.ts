import { Component, inject, effect, viewChild, ElementRef } from '@angular/core';
import { HabitService } from '../../services/habit.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class ChartComponent {
  protected readonly svc = inject(HabitService);
  private chart: Chart | null = null;
  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    effect(() => {
      const canvas = this.canvasRef();
      if (!canvas) return;

      const days = this.svc.daysArray();
      const counts = this.svc.dailyCompletionCounts();
      const labels = days.map(d => String(d));

      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = counts;
        this.chart.update('none');
      } else {
        this.chart = new Chart(canvas.nativeElement, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Completed Habits',
              data: counts,
              borderColor: '#e5e5e5',
              backgroundColor: 'rgba(229, 229, 229, 0.05)',
              borderWidth: 1.5,
              pointBackgroundColor: '#e5e5e5',
              pointBorderColor: '#e5e5e5',
              pointRadius: 2,
              pointHoverRadius: 5,
              tension: 0.3,
              fill: true,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1a1a1a',
                titleColor: '#e5e5e5',
                bodyColor: '#999',
                borderColor: '#2a2a2a',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                displayColors: false,
              },
            },
            scales: {
              x: {
                grid: {
                  color: 'rgba(255,255,255,0.03)',
                },
                ticks: {
                  color: '#555',
                  font: { size: 10, family: 'Inter' },
                  maxRotation: 0,
                  callback: function(_, index) {
                    // Show every 5th label to avoid clutter
                    return (index + 1) % 5 === 0 || index === 0 ? String(index + 1) : '';
                  },
                },
                border: { display: false },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(255,255,255,0.03)',
                },
                ticks: {
                  color: '#555',
                  font: { size: 10, family: 'Inter' },
                  stepSize: 1,
                  precision: 0,
                },
                border: { display: false },
              },
            },
          },
        });
      }
    });
  }
}
