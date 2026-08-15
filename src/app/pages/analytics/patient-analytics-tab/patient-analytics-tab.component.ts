import { Component, Input } from '@angular/core';
import { IPatientAnalyticsResponse } from '@core/interfaces/analytics/analytics.interface';
import { buildBarChartData, buildLineChartData } from '@app/shared/utils/analytics-chart.util';

const CHART_OPTIONS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

@Component({
  selector: 'app-patient-analytics-tab',
  standalone: false,
  templateUrl: './patient-analytics-tab.component.html',
  styleUrl: './patient-analytics-tab.component.scss',
})
export class PatientAnalyticsTabComponent {
  @Input() analytics: IPatientAnalyticsResponse | null = null;
  @Input() loading = false;

  chartOptions = CHART_OPTIONS;

  get registrationTrendChartData() {
    return this.analytics ? buildLineChartData(this.analytics.newRegistrationTrend, 'New registrations') : null;
  }

  get topDiagnosesChartData() {
    return this.analytics
      ? buildBarChartData(
          this.analytics.topDiagnoses.map((d) => ({ name: d.diagnosis, count: d.count })),
          'Prescriptions',
        )
      : null;
  }
}
