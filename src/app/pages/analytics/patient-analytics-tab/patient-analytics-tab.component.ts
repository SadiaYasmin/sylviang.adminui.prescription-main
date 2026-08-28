import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AnalyticsGranularity, IPatientAnalyticsResponse } from '@core/interfaces/analytics/analytics.interface';
import { buildBarChartData, buildLineChartData } from '@app/shared/utils/analytics-chart.util';

const ZERO_BASED_SCALES = { y: { beginAtZero: true, ticks: { precision: 0 } } };

const TREND_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y} registration${ctx.parsed.y === 1 ? '' : 's'}`,
      },
    },
  },
  scales: ZERO_BASED_SCALES,
};

const BAR_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: ZERO_BASED_SCALES,
};

@Component({
  selector: 'app-patient-analytics-tab',
  standalone: false,
  templateUrl: './patient-analytics-tab.component.html',
  styleUrl: './patient-analytics-tab.component.scss',
})
export class PatientAnalyticsTabComponent implements OnChanges {
  @Input() analytics: IPatientAnalyticsResponse | null = null;
  @Input() loading = false;

  @Input() trendLoading = false;
  @Input() trendGranularity: AnalyticsGranularity = 'Day';
  @Output() trendGranularityChange = new EventEmitter<AnalyticsGranularity>();

  trendChartOptions = TREND_CHART_OPTIONS;
  barChartOptions = BAR_CHART_OPTIONS;

  readonly trendGranularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

  /**
   * Chart `[data]` objects, computed once per input change rather than as getters — a getter
   * is re-invoked (and returns a brand-new object) on every Angular change-detection pass, so
   * p-chart sees a "changed" input every tick and keeps re-initializing instead of settling
   * into one stable render. See doctor-details.component.ts for the same fix applied first.
   */
  registrationTrendChartData: ReturnType<typeof buildLineChartData> | null = null;
  topDiagnosesChartData: ReturnType<typeof buildBarChartData> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['analytics']) {
      this.registrationTrendChartData =
        this.analytics && this.analytics.newRegistrationTrend.length > 0
          ? buildLineChartData(this.analytics.newRegistrationTrend, 'New registrations')
          : null;
      this.topDiagnosesChartData = this.analytics
        ? buildBarChartData(
            this.analytics.topDiagnoses.map((d) => ({ name: d.diagnosis, count: d.count })),
            'Prescriptions',
          )
        : null;
    }
  }

  selectTrendGranularity(value: AnalyticsGranularity): void {
    if (value !== this.trendGranularity) {
      this.trendGranularityChange.emit(value);
    }
  }
}
