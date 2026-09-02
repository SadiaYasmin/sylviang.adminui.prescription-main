import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IExecutiveSummaryResponse, PrescriptionTrendRangePreset } from '@core/interfaces/analytics/analytics.interface';

@Component({
  selector: 'app-executive-summary-tab',
  standalone: false,
  templateUrl: './executive-summary-tab.component.html',
  styleUrl: './executive-summary-tab.component.scss',
})
export class ExecutiveSummaryTabComponent {
  @Input() summary: IExecutiveSummaryResponse | null = null;
  @Input() loading = false;

  @Input() rangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  @Output() rangePresetChange = new EventEmitter<PrescriptionTrendRangePreset>();
  @Output() customRangeChange = new EventEmitter<{ from: Date; to: Date }>();
  /** Resolved concrete bounds of the above, for carrying the exact same period into the Total Patients/Completed Prescriptions navigation. */
  @Input() rangeFrom = '';
  @Input() rangeTo = '';

  /** "vs. X {previousPeriodLabel}" text for the Prescriptions/New Patients comparison cards — tracks whichever period the global filter has selected. */
  get previousPeriodLabel(): string {
    switch (this.rangePreset) {
      case 'Last7Days':
        return 'previous 7 days';
      case 'Last3Months':
        return 'previous 3 months';
      case 'Custom':
        return 'previous period';
      case 'Last30Days':
      default:
        return 'previous 30 days';
    }
  }
}
