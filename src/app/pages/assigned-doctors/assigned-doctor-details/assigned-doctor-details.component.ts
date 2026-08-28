import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';
import { IAssignedDoctorDetails } from '@core/interfaces/doctors/doctor.interface';
import { AssignedDoctorsService } from '@core/services/doctors/assigned-doctors.service';

/** A staff member's read-only detail view of one of their own assigned doctors. */
@Component({
  selector: 'app-assigned-doctor-details',
  standalone: false,
  templateUrl: './assigned-doctor-details.component.html',
  styleUrl: './assigned-doctor-details.component.scss',
})
export class AssignedDoctorDetailsComponent implements OnInit {
  constructor(
    private assignedDoctorsService: AssignedDoctorsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  readonly resolveAssetUrl = resolveAssetUrl;

  doctor: IAssignedDoctorDetails | null = null;
  loading = true;

  ngOnInit(): void {
    const doctorId = Number(this.route.snapshot.paramMap.get('id'));
    this.assignedDoctorsService.getDetails(doctorId).subscribe({
      next: (response) => {
        this.doctor = !response.hasError && response.content ? response.content : null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctor = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
