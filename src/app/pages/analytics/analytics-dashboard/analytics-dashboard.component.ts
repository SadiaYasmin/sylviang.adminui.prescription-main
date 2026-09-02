import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
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
import { ANALYTICS_MONO_TABS_DT } from '@app/shared/utils/analytics-mono-tokens.util';

type AnalyticsTabKey = 'summary' | 'medicines' | 'doctors' | 'trends' | 'patients';

const ANALYTICS_TAB_KEYS: AnalyticsTabKey[] = ['summary', 'medicines', 'doctors', 'trends', 'patients'];

/**
 * US-072–076: the Admin analytics suite. One page, five tabs (matching the reference
 * prototype's UX) — each tab's data is fetched lazily on first activation, not all
 * upfront, and cached for the rest of the session (switching tabs back and forth doesn't
 * re-fetch). The backend does all aggregation (US-079); this component only orchestrates
 * which endpoint to call and hands the response straight to a presentational tab component.
 *
 * Every tab owns ONE independent date-range filter (Last 7/30/90 Days/Custom, default
 * Last 30 Days) — Doctor Performance and Prescription Trends both need the doctor
 * leaderboard/busiest-hours data, but with their own separate range, so those are fetched
 * twice (once per tab) rather than shared like before this filter existed.
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

  /** Scoped design-token override so the tab indicator/active-tab text match this page's monochromatic teal instead of the app's global primary color — see analytics-mono-tokens.util.ts. */
  readonly tabsDt = ANALYTICS_MONO_TABS_DT;

  summary: IExecutiveSummaryResponse | null = null;
  summaryLoading = false;
  summaryRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  private summaryCustomFrom: Date | null = null;
  private summaryCustomTo: Date | null = null;

  medicineAnalytics: IMedicineAnalyticsResponse | null = null;
  medicineLoading = false;

  medicineTrend: IPrescriptionVolumeTrendResponse | null = null;
  medicineTrendLoading = false;
  medicineTrendGranularity: AnalyticsGranularity = 'Day';
  /** Doubles as the Medicine & Prescription tab's one global date-range filter — drives the KPI cards/tables and the trend chart alike. */
  medicineTrendRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  private medicineTrendCustomFrom: Date | null = null;
  private medicineTrendCustomTo: Date | null = null;

  doctorPerfLeaderboard: IDoctorLeaderboardEntry[] | null = null;
  doctorPerfLoading = false;
  doctorPerfRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  private doctorPerfCustomFrom: Date | null = null;
  private doctorPerfCustomTo: Date | null = null;

  trendsLeaderboard: IDoctorLeaderboardEntry[] | null = null;
  trendsLeaderboardLoading = false;
  trendsBusiestHours: IBusiestConsultationHoursResponse | null = null;
  trendsBusiestHoursLoading = false;

  trend: IPrescriptionVolumeTrendResponse | null = null;
  trendGranularity: AnalyticsGranularity = 'Day';
  /** Doubles as the Prescription Trends tab's one global date-range filter — drives the volume chart, the per-doctor chart, and the peak-hours chart alike. */
  trendRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  trendLoading = false;
  private trendCustomFrom: Date | null = null;
  private trendCustomTo: Date | null = null;

  patientAnalytics: IPatientAnalyticsResponse | null = null;
  patientLoading = false;
  patientTrendLoading = false;
  patientTrendGranularity: AnalyticsGranularity = 'Day';
  patientRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  private patientCustomFrom: Date | null = null;
  private patientCustomTo: Date | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ title: 'Analytics & Reports', icon: 'fa-solid fa-chart-pie', href: '/analytics' }]);

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
        this.loadMedicineTabData();
        break;
      case 'doctors':
        this.loadDoctorPerfLeaderboard();
        break;
      case 'trends':
        this.loadTrendsTabData();
        break;
      case 'patients':
        this.loadPatientAnalytics();
        break;
    }
  }

  /** Exposed to the tab so its "Total Patients"/"Completed Prescriptions" cards can carry the exact same resolved range into their destination pages. */
  summaryRangeFrom = '';
  summaryRangeTo = '';

  private resolveSummaryRange() {
    return resolvePrescriptionTrendRange(this.summaryRangePreset, this.summaryCustomFrom, this.summaryCustomTo);
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    const { from, to } = this.resolveSummaryRange();
    this.summaryRangeFrom = from;
    this.summaryRangeTo = to;
    this.analyticsService.getExecutiveSummary(from, to).subscribe({
      next: (response) => {
        this.summary = !response.hasError && response.content ? response.content : null;
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
      },
    });
  }

  onSummaryRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.summaryRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadSummary();
    }
  }

  onSummaryCustomRangeChange(range: { from: Date; to: Date }): void {
    this.summaryCustomFrom = range.from;
    this.summaryCustomTo = range.to;
    this.loadSummary();
  }

  /** Exposed to the tab so its "Total/Unique Medicines Prescribed" cards can carry the exact same resolved range into the Medicine List navigation. */
  medicineRangeFrom = '';
  medicineRangeTo = '';

  private resolveMedicineTrendRange() {
    return resolvePrescriptionTrendRange(this.medicineTrendRangePreset, this.medicineTrendCustomFrom, this.medicineTrendCustomTo);
  }

  private loadMedicineTabData(): void {
    const { from, to } = this.resolveMedicineTrendRange();
    this.medicineRangeFrom = from;
    this.medicineRangeTo = to;

    this.medicineLoading = true;
    this.analyticsService.getMedicineAnalytics(from, to).subscribe({
      next: (response) => {
        this.medicineAnalytics = !response.hasError && response.content ? response.content : null;
        this.medicineLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.medicineLoading = false;
      },
    });

    this.medicineTrendLoading = true;
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
    this.loadMedicineTabData();
  }

  onMedicineTrendRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.medicineTrendRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadMedicineTabData();
    }
  }

  onMedicineTrendCustomRangeChange(range: { from: Date; to: Date }): void {
    this.medicineTrendCustomFrom = range.from;
    this.medicineTrendCustomTo = range.to;
    this.loadMedicineTabData();
  }

  private resolveDoctorPerfRange() {
    return resolvePrescriptionTrendRange(this.doctorPerfRangePreset, this.doctorPerfCustomFrom, this.doctorPerfCustomTo);
  }

  private loadDoctorPerfLeaderboard(): void {
    this.doctorPerfLoading = true;
    const { from, to } = this.resolveDoctorPerfRange();
    this.analyticsService.getDoctorLeaderboard(from, to).subscribe({
      next: (response) => {
        this.doctorPerfLeaderboard = !response.hasError && response.content ? response.content : null;
        this.doctorPerfLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.doctorPerfLoading = false;
      },
    });
  }

  onDoctorPerfRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.doctorPerfRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadDoctorPerfLeaderboard();
    }
  }

  onDoctorPerfCustomRangeChange(range: { from: Date; to: Date }): void {
    this.doctorPerfCustomFrom = range.from;
    this.doctorPerfCustomTo = range.to;
    this.loadDoctorPerfLeaderboard();
  }

  private resolveTrendRange() {
    return resolvePrescriptionTrendRange(this.trendRangePreset, this.trendCustomFrom, this.trendCustomTo);
  }

  private loadTrendsTabData(): void {
    const { from, to } = this.resolveTrendRange();

    this.trendLoading = true;
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

    this.trendsLeaderboardLoading = true;
    this.analyticsService.getDoctorLeaderboard(from, to).subscribe({
      next: (response) => {
        this.trendsLeaderboard = !response.hasError && response.content ? response.content : null;
        this.trendsLeaderboardLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.trendsLeaderboardLoading = false;
      },
    });

    this.trendsBusiestHoursLoading = true;
    this.analyticsService.getBusiestConsultationHours(from, to).subscribe({
      next: (response) => {
        this.trendsBusiestHours = !response.hasError && response.content ? response.content : null;
        this.trendsBusiestHoursLoading = false;
        this.nudgeChartResize();
      },
      error: () => {
        this.trendsBusiestHoursLoading = false;
      },
    });
  }

  onTrendGranularityChange(granularity: AnalyticsGranularity): void {
    this.trendGranularity = granularity;
    this.loadTrendsTabData();
  }

  onTrendRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.trendRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadTrendsTabData();
    }
  }

  onTrendCustomRangeChange(range: { from: Date; to: Date }): void {
    this.trendCustomFrom = range.from;
    this.trendCustomTo = range.to;
    this.loadTrendsTabData();
  }

  /** Exposed to the tab so its "New Patients" card can carry the exact same resolved range into the Patient List navigation. */
  patientRangeFrom = '';
  patientRangeTo = '';

  private resolvePatientRange() {
    return resolvePrescriptionTrendRange(this.patientRangePreset, this.patientCustomFrom, this.patientCustomTo);
  }

  private loadPatientAnalytics(isInitialLoad = true): void {
    this.patientLoading = isInitialLoad;
    this.patientTrendLoading = !isInitialLoad;
    const { from, to } = this.resolvePatientRange();
    this.patientRangeFrom = from;
    this.patientRangeTo = to;
    this.analyticsService.getPatientAnalytics(this.patientTrendGranularity, from, to).subscribe({
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

  onPatientRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.patientRangePreset = preset;
    if (preset !== 'Custom') {
      this.loadPatientAnalytics(false);
    }
  }

  onPatientCustomRangeChange(range: { from: Date; to: Date }): void {
    this.patientCustomFrom = range.from;
    this.patientCustomTo = range.to;
    this.loadPatientAnalytics(false);
  }
}
