import { Component, Input } from '@angular/core';
import { IMedicineAnalyticsResponse, IPrescriptionVolumeTrendResponse } from '@core/interfaces/analytics/analytics.interface';
import { buildBarChartData, buildLineChartData } from '@app/shared/utils/analytics-chart.util';

const CHART_OPTIONS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

@Component({
  selector: 'app-medicine-prescription-tab',
  standalone: false,
  templateUrl: './medicine-prescription-tab.component.html',
  styleUrl: './medicine-prescription-tab.component.scss',
})
export class MedicinePrescriptionTabComponent {
  @Input() analytics: IMedicineAnalyticsResponse | null = null;
  @Input() trend: IPrescriptionVolumeTrendResponse | null = null;
  @Input() loading = false;

  chartOptions = CHART_OPTIONS;

  get topMedicinesChartData() {
    return this.analytics ? buildBarChartData(this.analytics.topPrescribedMedicines, 'Times prescribed') : null;
  }

  get categoryChartData() {
    return this.analytics
      ? buildBarChartData(
          this.analytics.categoryBreakdown.map((c) => ({ name: c.category, count: c.count })),
          'Prescriptions',
        )
      : null;
  }

  get trendChartData() {
    return this.trend ? buildLineChartData(this.trend.points, 'Prescriptions per day') : null;
  }
}
