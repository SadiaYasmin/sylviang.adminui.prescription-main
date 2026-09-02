import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { AnalyticsGranularity, PrescriptionTrendRangePreset } from '@core/interfaces/analytics/analytics.interface';
import { IDoctorDetailsResponse } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';
import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
import { resolvePrescriptionTrendRange } from '@app/shared/utils/prescription-trend-range.util';
import {
  buildDonutChartOptions,
  buildHourBarChartDataAmPm,
  buildHourBarChartOptions,
  buildLineChartData,
  buildMedicineDistributionChartData,
} from '@app/shared/utils/analytics-chart.util';

const MEDICINE_DISTRIBUTION_TOP_N = 6;

function buildActivityTrendChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
}

@Component({
  selector: 'app-doctor-details',
  standalone: false,
  templateUrl: './doctor-details.component.html',
  styleUrl: './doctor-details.component.scss',
})
export class DoctorDetailsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private toast: ToastService,
    private breadcrumbService: BreadcrumbService,
  ) {}

  details: IDoctorDetailsResponse | null = null;
  loading = true;
  activityTrendLoading = false;
  private doctorId: number | null = null;

  readonly resolveAssetUrl = resolveAssetUrl;
  chartOptions = buildActivityTrendChartOptions();
  hourChartOptions = buildHourBarChartOptions();
  donutChartOptions = buildDonutChartOptions();

  activityGranularity: AnalyticsGranularity = 'Day';
  readonly activityGranularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

  /** The page's one global date-range filter — drives every KPI/chart except Today's/This Month's Prescriptions. */
  rangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  private customFrom: Date | null = null;
  private customTo: Date | null = null;

  /**
   * Chart `[data]` objects, computed once per load rather than as getters — a getter is
   * re-invoked (and returns a brand-new object) on every Angular change-detection pass, so
   * p-chart sees a "changed" input every tick and re-animates from scratch. Doughnut's
   * rotate-in animation made this the most visible as a chart that kept "loading again and
   * again"; line/bar charts had the identical bug, just less noticeably.
   */
  activityTrendChartData: ReturnType<typeof buildLineChartData> | null = null;
  busiestHoursChartData: ReturnType<typeof buildHourBarChartDataAmPm> | null = null;
  medicineDistributionChartData: ReturnType<typeof buildMedicineDistributionChartData> | null = null;

  private updateChartData(): void {
    const performance = this.details?.performance;

    const trend = performance?.activityTrend;
    this.activityTrendChartData =
      trend && trend.length > 0
        ? buildLineChartData(
            trend.map((p) => ({ bucketKey: p.period.slice(0, 10), count: p.count })),
            'Prescriptions per day',
          )
        : null;

    const hours = performance?.busiestHours;
    this.busiestHoursChartData =
      hours && !hours.every((h) => h.count === 0)
        ? buildHourBarChartDataAmPm(hours, 'Consultations checked in (Bangladesh Time)')
        : null;

    const allMedicines = performance?.allMedicines;
    this.medicineDistributionChartData =
      allMedicines && allMedicines.length > 0 ? buildMedicineDistributionChartData(allMedicines, MEDICINE_DISTRIBUTION_TOP_N) : null;
  }

  private resolveRange() {
    return resolvePrescriptionTrendRange(this.rangePreset, this.customFrom, this.customTo);
  }

  /** Total Prescriptions card → Consultations, this doctor, the page's selected date range. */
  get consultationsFilteredQueryParams(): Record<string, string | number> {
    const { from, to } = this.resolveRange();
    return { doctorId: this.doctorId!, dateMode: 'Range', fromDate: from, toDate: to };
  }

  /** Today's Prescriptions card → Consultations, this doctor, today only — independent of the page's date filter. */
  get consultationsTodayQueryParams(): Record<string, string | number> {
    return { doctorId: this.doctorId!, dateMode: 'Today' };
  }

  /** This Month's Prescriptions card → Consultations, this doctor, current calendar month — independent of the page's date filter. */
  get consultationsThisMonthQueryParams(): Record<string, string | number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      doctorId: this.doctorId!,
      dateMode: 'Range',
      fromDate: DateTimeUtility.formatDateForAPI(monthStart),
      toDate: DateTimeUtility.formatDateForAPI(monthEnd),
    };
  }

  /** Total Medicines Prescribed card → Medicine List, scoped to this doctor + the page's selected date range. `preset` lets Medicine List show/select the same filter option; `from`/`to` are the resolved concrete bounds it needs for Custom (and to query with immediately). */
  get medicineListQueryParams(): Record<string, string | number> {
    const { from, to } = this.resolveRange();
    return { doctorId: this.doctorId!, doctorName: this.details?.profile.fullName ?? '', preset: this.rangePreset, from, to };
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Doctor Management', icon: 'fa-solid fa-user-doctor', href: '/doctors/doctor-list' },
      { title: 'Doctor Details', icon: 'fa-solid fa-eye', href: `/doctors/doctor-details/${this.route.snapshot.paramMap.get('id')}` },
    ]);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/doctors/doctor-list']);
      return;
    }

    this.doctorId = +idParam;
    this.loadDetails(true);
  }

  selectActivityGranularity(value: AnalyticsGranularity): void {
    if (value === this.activityGranularity) {
      return;
    }
    this.activityGranularity = value;
    this.loadDetails(false);
  }

  onRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.rangePreset = preset;
    if (preset !== 'Custom') {
      this.loadDetails(false);
    }
  }

  onCustomRangeChange(range: { from: Date; to: Date }): void {
    this.customFrom = range.from;
    this.customTo = range.to;
    this.loadDetails(false);
  }

  private loadDetails(isInitialLoad: boolean): void {
    if (!this.doctorId) {
      return;
    }
    this.loading = isInitialLoad;
    this.activityTrendLoading = !isInitialLoad;
    const { from, to } = this.resolveRange();
    this.doctorService.getDoctorById(this.doctorId, this.activityGranularity, from, to).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.details = response.content;
          this.updateChartData();
        } else {
          this.toast.error({ detail: 'Could not load this doctor.' });
          this.router.navigate(['/doctors/doctor-list']);
        }
        this.loading = false;
        this.activityTrendLoading = false;
      },
      error: () => {
        this.toast.error({ detail: 'Could not load this doctor.' });
        this.loading = false;
        this.activityTrendLoading = false;
        this.router.navigate(['/doctors/doctor-list']);
      },
    });
  }
}
