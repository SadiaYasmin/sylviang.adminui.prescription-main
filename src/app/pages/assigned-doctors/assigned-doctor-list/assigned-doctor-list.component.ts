import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BreadcrumbService } from '@app/@core/services';
import { IAssignedDoctorListItem } from '@core/interfaces/doctors/doctor.interface';
import { AssignedDoctorsService } from '@core/services/doctors/assigned-doctors.service';

/** A staff member's own read-only "assigned to me" roster of doctors. */
@Component({
  selector: 'app-assigned-doctor-list',
  standalone: false,
  templateUrl: './assigned-doctor-list.component.html',
  styleUrl: './assigned-doctor-list.component.scss',
})
export class AssignedDoctorListComponent implements OnInit {
  constructor(
    private assignedDoctorsService: AssignedDoctorsService,
    private cdr: ChangeDetectorRef,
    private breadcrumbService: BreadcrumbService,
  ) {}

  doctors: IAssignedDoctorListItem[] = [];
  loading = false;

  get skeletonItems() {
    return Array(3)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ title: 'Assigned Doctors', icon: 'fa-solid fa-user-doctor', href: '/assigned-doctors' }]);
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    this.assignedDoctorsService.getList().subscribe({
      next: (response) => {
        this.doctors = !response.hasError && response.content ? response.content.doctors : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctors = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
