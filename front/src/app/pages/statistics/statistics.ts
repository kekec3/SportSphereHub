import { Component, computed, inject, signal } from '@angular/core';
import { StatsService } from '../../services/stats.service';
import { BarChart } from '../../components/bar-chart/bar-chart';
import { LineChart } from '../../components/line-chart/line-chart';

@Component({
  selector: 'app-statistics',
  imports: [BarChart, LineChart],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class Statistics {
  statsService = inject(StatsService);

  loading = signal(true);
  error = signal('');

  perSport = signal<{ label: string; value: number }[]>([]);
  perMonth = signal<{ label: string; value: number }[]>([]);
  globalSpend = signal(0);
  mySpend = signal(0);

  topSport = computed(() => {
    const data = this.perSport();
    return data.length ? data.reduce((a, b) => (b.value > a.value ? b : a)).label : '—';
  });

  ngOnInit() {
    this.statsService.dashboard().subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data == null) {
          this.error.set('Neuspešno učitavanje statistike.');
          return;
        }
        this.perSport.set((data.perSport || []).map((item: any) => ({ label: item.sport, value: item.count })));
        this.perMonth.set((data.perMonth || []).map((item: any) => ({ label: item.label, value: item.count })));
        this.globalSpend.set(data.globalSpend || 0);
        this.mySpend.set(data.mySpend || 0);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Neuspešno učitavanje statistike.');
      },
    });
  }
}
