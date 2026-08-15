import { Component, Input } from '@angular/core';
import { IDoctorLeaderboardEntry } from '@core/interfaces/analytics/analytics.interface';

@Component({
  selector: 'app-doctor-performance-tab',
  standalone: false,
  templateUrl: './doctor-performance-tab.component.html',
  styleUrl: './doctor-performance-tab.component.scss',
})
export class DoctorPerformanceTabComponent {
  @Input() leaderboard: IDoctorLeaderboardEntry[] | null = null;
  @Input() loading = false;
}
