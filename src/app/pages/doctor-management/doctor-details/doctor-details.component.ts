import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsGranularity } from '@core/interfaces/analytics/analytics.interface';
import { IDoctorDetailsResponse, IDoctorTopMedicine } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';
import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
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
  ) {}

  details: IDoctorDetailsResponse | null = null;
  loading = true;
  activityTrendLoading = false;
  private doctorId: number | null = null;

  readonly resolveAssetUrl = resolveAssetUrl;
  chartOptions = buildActivityTrendChartOptions();
  hourChartOptions = buildHourBarChartOptions();
  donutChartOptions = buildDonutChartOptions();

  showAllMedicinesDialog = false;
  allMedicinesSearchTerm = '';

  activityGranularity: AnalyticsGranularity = 'Day';
  readonly activityGranularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

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

  get filteredAllMedicines(): IDoctorTopMedicine[] {
    const all = this.details?.performance.allMedicines ?? [];
    const term = this.allMedicinesSearchTerm.trim().toLowerCase();
    if (!term) {
      return all;
    }
    return all.filter((m) => m.name.toLowerCase().includes(term));
  }

  openAllMedicinesDialog(): void {
    this.allMedicinesSearchTerm = '';
    this.showAllMedicinesDialog = true;
  }

  /** Total Prescriptions card → Consultations, this doctor, no date filter. */
  get consultationsAllTimeQueryParams(): Record<string, number> {
    return { doctorId: this.doctorId! };
  }

  /** Today's Prescriptions card → Consultations, this doctor, today only. */
  get consultationsTodayQueryParams(): Record<string, string | number> {
    return { doctorId: this.doctorId!, dateMode: 'Today' };
  }

  /** This Month's Prescriptions card → Consultations, this doctor, current calendar month. */
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

  ngOnInit(): void {
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

  private loadDetails(isInitialLoad: boolean): void {
    if (!this.doctorId) {
      return;
    }
    this.loading = isInitialLoad;
    this.activityTrendLoading = !isInitialLoad;
    this.doctorService.getDoctorById(this.doctorId, this.activityGranularity).subscribe({
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
