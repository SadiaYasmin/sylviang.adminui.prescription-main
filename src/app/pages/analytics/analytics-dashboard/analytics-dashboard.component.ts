import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics/analytics.service';
import {
  AnalyticsGranularity,
  IBusiestConsultationHoursResponse,
  IDoctorLeaderboardEntry,
  IExecutiveSummaryResponse,
  IMedicineAnalyticsResponse,
  IPatientAnalyticsResponse,
  IPrescriptionVolumeTrendResponse,
  PrescriptionTrendRangePreset,
} from '@core/interfaces/analytics/analytics.interface';
import { resolvePrescriptionTrendRange } from '@app/shared/utils/prescription-trend-range.util';

type AnalyticsTabKey = 'summary' | 'medicines' | 'doctors' | 'trends' | 'patients';

const ANALYTICS_TAB_KEYS: AnalyticsTabKey[] = ['summary', 'medicines', 'doctors', 'trends', 'patients'];

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
  /** Backs both the Doctor Performance table and the two charts on the Trends tab — fetched once regardless of which tab is opened first. */
  private doctorPerfDataLoaded = false;

  summary: IExecutiveSummaryResponse | null = null;
  summaryLoading = false;

  medicineAnalytics: IMedicineAnalyticsResponse | null = null;
  medicineLoading = false;

  medicineTrend: IPrescriptionVolumeTrendResponse | null = null;
  medicineTrendLoading = false;
  medicineTrendGranularity: AnalyticsGranularity = 'Day';
  medicineTrendRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  private medicineTrendCustomFrom: Date | null = null;
  private medicineTrendCustomTo: Date | null = null;

  leaderboard: IDoctorLeaderboardEntry[] | null = null;
  leaderboardLoading = false;

  busiestHours: IBusiestConsultationHoursResponse | null = null;
  busiestHoursLoading = false;

  trend: IPrescriptionVolumeTrendResponse | null = null;
  trendGranularity: AnalyticsGranularity = 'Day';
  trendRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  trendLoading = false;
  private trendCustomFrom: Date | null = null;
  private trendCustomTo: Date | null = null;

  patientAnalytics: IPatientAnalyticsResponse | null = null;
  patientLoading = false;
  patientTrendLoading = false;
  patientTrendGranularity: AnalyticsGranularity = 'Day';

  constructor(
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab && (ANALYTICS_TAB_KEYS as string[]).includes(requestedTab)) {
      this.activeTab = requestedTab as AnalyticsTabKey;
    }
    this.loadTab(this.activeTab);
  }

  onTabChange(value: string): void {
    this.activeTab = value as AnalyticsTabKey;
    this.loadTab(this.activeTab);
    this.nudgeChartResize();
    // Keeps the selected tab across a page reload/bookmark — without this the URL never
    // reflects which tab is open, so refreshing always drops back to Executive Summary.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.activeTab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * PrimeNG's Tabs hides inactive panels with CSS (`display: none`) rather than removing them
   * from the DOM — every tab's chart components exist from page load, not just the active one.
   * A Chart.js instance created (or resized) while its ancestor panel is still `display: none`
   * measures a zero/stale container size and never self-corrects once the panel becomes
   * visible, since nothing re-triggers its resize logic. A synthetic window `resize` event is
   * the standard workaround — `responsive: true` charts listen for it globally and re-measure
   * their actual container, regardless of which component created them or when. Called after
   * every tab switch and after every response that populates a chart, since a just-created
   * chart (first-ever activation, data arriving async) needs the same nudge a freshly-shown
   * one does.
   */
  private nudgeChartResize(): void {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
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
        this.ensureDoctorPerfDataLoaded();
        break;
      case 'trends':
        this.loadTrend();
        this.ensureDoctorPerfDataLoaded();
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
        this.nudgeChartResize();
      },
      error: () => {
        this.medicineLoading = false;
      },
    });
    this.loadMedicineTrend();
  }

  private loadMedicineTrend(): void {
    this.medicineTrendLoading = true;
    const { from, to } = resolvePrescriptionTrendRange(
      this.medicineTrendRangePreset,
      this.medicineTrendCustomFrom,
      this.medicineTrendCustomTo,
    );
    this.analyticsService.getPrescriptionTrend(this.medicineTrendGranularity, from, to).subscribe({
      next: (response) => {
        this.medicineTrend = !response.hasError && response.content ? response.content : null;
        this.medicineTrendLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.medicineTrendLoading = false;
      },
    });
  }

  onMedicineTrendGranularityChange(granularity: AnalyticsGranularity): void {
    this.medicineTrendGranularity = granularity;
    this.loadMedicineTrend();
  }

  onMedicineTrendRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.medicineTrendRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadMedicineTrend();
    }
  }

  onMedicineTrendCustomRangeChange(range: { from: Date; to: Date }): void {
    this.medicineTrendCustomFrom = range.from;
    this.medicineTrendCustomTo = range.to;
    this.loadMedicineTrend();
  }

  private ensureDoctorPerfDataLoaded(): void {
    if (this.doctorPerfDataLoaded) {
      return;
    }
    this.doctorPerfDataLoaded = true;
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    this.leaderboardLoading = true;
    this.analyticsService.getDoctorLeaderboard().subscribe({
      next: (response) => {
        this.leaderboard = !response.hasError && response.content ? response.content : null;
        this.leaderboardLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.leaderboardLoading = false;
      },
    });

    this.busiestHoursLoading = true;
    this.analyticsService.getBusiestConsultationHours().subscribe({
      next: (response) => {
        this.busiestHours = !response.hasError && response.content ? response.content : null;
        this.busiestHoursLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.busiestHoursLoading = false;
      },
    });
  }

  private loadTrend(): void {
    this.trendLoading = true;
    const { from, to } = resolvePrescriptionTrendRange(this.trendRangePreset, this.trendCustomFrom, this.trendCustomTo);
    this.analyticsService.getPrescriptionTrend(this.trendGranularity, from, to).subscribe({
      next: (response) => {
        this.trend = !response.hasError && response.content ? response.content : null;
        this.trendLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.trendLoading = false;
      },
    });
  }

  onTrendGranularityChange(granularity: AnalyticsGranularity): void {
    this.trendGranularity = granularity;
    this.loadTrend();
  }

  onTrendRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.trendRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadTrend();
    }
  }

  onTrendCustomRangeChange(range: { from: Date; to: Date }): void {
    this.trendCustomFrom = range.from;
    this.trendCustomTo = range.to;
    this.loadTrend();
  }

  private loadPatientAnalytics(isInitialLoad = true): void {
    this.patientLoading = isInitialLoad;
    this.patientTrendLoading = !isInitialLoad;
    this.analyticsService.getPatientAnalytics(this.patientTrendGranularity).subscribe({
      next: (response) => {
        this.patientAnalytics = !response.hasError && response.content ? response.content : null;
        this.patientLoading = false;
        this.patientTrendLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.patientLoading = false;
        this.patientTrendLoading = false;
      },
    });
  }

  onPatientTrendGranularityChange(granularity: AnalyticsGranularity): void {
    this.patientTrendGranularity = granularity;
    this.loadPatientAnalytics(false);
  }
}
