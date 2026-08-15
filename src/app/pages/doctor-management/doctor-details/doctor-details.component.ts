import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IDoctorDetailsResponse } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';

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
