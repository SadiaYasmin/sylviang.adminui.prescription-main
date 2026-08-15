import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AnalyticsGranularity, IPrescriptionVolumeTrendResponse } from '@core/interfaces/analytics/analytics.interface';
import { buildLineChartData } from '@app/shared/utils/analytics-chart.util';

const CHART_OPTIONS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

@Component({
  selector: 'app-prescription-trends-tab',
  standalone: false,
  templateUrl: './prescription-trends-tab.component.html',
  styleUrl: './prescription-trends-tab.component.scss',
})
export class PrescriptionTrendsTabComponent {
  @Input() trend: IPrescriptionVolumeTrendResponse | null = null;
  @Input() granularity: AnalyticsGranularity = 'Day';
  @Input() loading = false;
  @Output() granularityChange = new EventEmitter<AnalyticsGranularity>();

  chartOptions = CHART_OPTIONS;

  readonly granularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

  get chartData() {
    return this.trend ? buildLineChartData(this.trend.points, 'Finalized prescriptions') : null;
  }

  selectGranularity(value: AnalyticsGranularity): void {
    if (value !== this.granularity) {
      this.granularityChange.emit(value);
    }
  }
}
