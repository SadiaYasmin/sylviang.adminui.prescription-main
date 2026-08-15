import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IDoctorDetailsResponse } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';
import { buildHourBarChartData, buildLineChartData } from '@app/shared/utils/analytics-chart.util';

const CHART_OPTIONS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

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

  readonly resolveAssetUrl = resolveAssetUrl;
  chartOptions = CHART_OPTIONS;

  get activityTrendChartData() {
    const trend = this.details?.performance.activityTrend;
    if (!trend || trend.length === 0) return null;
    return buildLineChartData(
      trend.map((p) => ({ bucketKey: p.period.slice(0, 10), count: p.count })),
      'Prescriptions per day',
    );
  }

  get busiestHoursChartData() {
    const hours = this.details?.performance.busiestHours;
    if (!hours || hours.every((h) => h.count === 0)) return null;
    return buildHourBarChartData(hours, 'Consultations checked in (UTC hour)');
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/doctors/doctor-list']);
      return;
    }

    this.doctorService.getDoctorById(+idParam).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.details = response.content;
        } else {
          this.toast.error({ detail: 'Could not load this doctor.' });
          this.router.navigate(['/doctors/doctor-list']);
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error({ detail: 'Could not load this doctor.' });
        this.loading = false;
        this.router.navigate(['/doctors/doctor-list']);
      },
    });
  }
}
