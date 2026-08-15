import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '@core/services/analytics/analytics.service';
import {
  AnalyticsGranularity,
  IDoctorLeaderboardEntry,
  IExecutiveSummaryResponse,
  IMedicineAnalyticsResponse,
  IPatientAnalyticsResponse,
  IPrescriptionVolumeTrendResponse,
} from '@core/interfaces/analytics/analytics.interface';

type AnalyticsTabKey = 'summary' | 'medicines' | 'doctors' | 'trends' | 'patients';

/**
 * US-072–076: the Admin analytics suite. One page, five tabs (matching the reference
 * prototype's UX) — each tab's data is fetched lazily on first activation, not all
 * upfront, and cached for the rest of the session (switching tabs back and forth doesn't
 * re-fetch). The backend does all aggregation (US-079); this component only orchestrates
 * which endpoint to call and hands the response straight to a presentational tab component.
 */
@Component({
  selector: 'app-analytics-dashboard',
  standalone: false,
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent implements OnInit {
  activeTab: AnalyticsTabKey = 'summary';
  private loadedTabs = new Set<AnalyticsTabKey>();

  summary: IExecutiveSummaryResponse | null = null;
  summaryLoading = false;

  medicineAnalytics: IMedicineAnalyticsResponse | null = null;
  medicineTrend: IPrescriptionVolumeTrendResponse | null = null;
  medicineLoading = false;

  leaderboard: IDoctorLeaderboardEntry[] | null = null;
  leaderboardLoading = false;

  trend: IPrescriptionVolumeTrendResponse | null = null;
  trendGranularity: AnalyticsGranularity = 'Day';
  trendLoading = false;

  patientAnalytics: IPatientAnalyticsResponse | null = null;
  patientLoading = false;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadTab('summary');
  }

  onTabChange(value: string): void {
    this.activeTab = value as AnalyticsTabKey;
    this.loadTab(this.activeTab);
  }

  private loadTab(tab: AnalyticsTabKey): void {
    if (this.loadedTabs.has(tab)) {
      return;
    }
    this.loadedTabs.add(tab);

    switch (tab) {
      case 'summary':
        this.loadSummary();
        break;
      case 'medicines':
        this.loadMedicineAnalytics();
        break;
      case 'doctors':
        this.loadLeaderboard();
        break;
      case 'trends':
        this.loadTrend(this.trendGranularity);
        break;
      case 'patients':
        this.loadPatientAnalytics();
        break;
    }
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    this.analyticsService.getExecutiveSummary().subscribe({
      next: (response) => {
        this.summary = !response.hasError && response.content ? response.content : null;
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
      },
    });
  }

  private loadMedicineAnalytics(): void {
    this.medicineLoading = true;
    this.analyticsService.getMedicineAnalytics().subscribe({
      next: (response) => {
        this.medicineAnalytics = !response.hasError && response.content ? response.content : null;
        this.medicineLoading = false;
      },
      error: () => {
        this.medicineLoading = false;
      },
    });
    this.analyticsService.getPrescriptionTrend('Day').subscribe({
      next: (response) => {
        this.medicineTrend = !response.hasError && response.content ? response.content : null;
      },
      error: () => {
        // Non-critical — the tab's tables still render without the embedded trend chart.
      },
    });
  }

  private loadLeaderboard(): void {
    this.leaderboardLoading = true;
    this.analyticsService.getDoctorLeaderboard().subscribe({
      next: (response) => {
        this.leaderboard = !response.hasError && response.content ? response.content : null;
        this.leaderboardLoading = false;
      },
      error: () => {
        this.leaderboardLoading = false;
      },
    });
  }

  private loadTrend(granularity: AnalyticsGranularity): void {
    this.trendLoading = true;
    this.analyticsService.getPrescriptionTrend(granularity).subscribe({
      next: (response) => {
        this.trend = !response.hasError && response.content ? response.content : null;
        this.trendLoading = false;
      },
      error: () => {
        this.trendLoading = false;
      },
    });
  }

  onTrendGranularityChange(granularity: AnalyticsGranularity): void {
    this.trendGranularity = granularity;
    this.loadTrend(granularity);
  }

  private loadPatientAnalytics(): void {
    this.patientLoading = true;
    this.analyticsService.getPatientAnalytics().subscribe({
      next: (response) => {
        this.patientAnalytics = !response.hasError && response.content ? response.content : null;
        this.patientLoading = false;
      },
      error: () => {
        this.patientLoading = false;
      },
    });
  }
}
