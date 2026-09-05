import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IDoctorLeaderboardEntry, PrescriptionTrendRangePreset } from '@core/interfaces/analytics/analytics.interface';

@Component({
  selector: 'app-doctor-activity-tab',
  standalone: false,
  templateUrl: './doctor-activity-tab.component.html',
  styleUrl: './doctor-activity-tab.component.scss',
})
export class DoctorActivityTabComponent {
  @Input() leaderboard: IDoctorLeaderboardEntry[] | null = null;
  @Input() loading = false;

  @Input() rangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  @Output() rangePresetChange = new EventEmitter<PrescriptionTrendRangePreset>();
  @Output() customRangeChange = new EventEmitter<{ from: Date; to: Date }>();
}
