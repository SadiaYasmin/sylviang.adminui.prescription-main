import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@app/@core/constants';
import { IDoctorListSummary, IDoctorSummary } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { DoctorListColumns } from './doctor-list.component.constants';

@Component({
  selector: 'app-doctor-list',
  standalone: false,
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.scss',
})
export class DoctorListComponent implements OnInit {
  constructor(
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  doctors: IDoctorSummary[] = [];
  summary: IDoctorListSummary = { totalDoctors: 0, activeDoctors: 0, totalPrescriptions: 0, totalMedicineEntries: 0 };
  loading = false;
  totalRecords = 0;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  searchTerm = '';
  departmentFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  columns = DoctorListColumns;

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.loadDoctors();
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadDoctors();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.departmentFilter = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;

    this.doctorService
      .getDoctors({
        page: this.currentPage,
        pageSize: this.rows,
        searchTerm: this.searchTerm || undefined,
        department: this.departmentFilter || undefined,
        isActive: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
      })
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.doctors = response.content.doctors || [];
            this.totalRecords = response.content.totalCount || 0;
            this.summary = response.content.summary;
          } else {
            this.doctors = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.doctors = [];
          this.totalRecords = 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadDoctors();
  }

  deactivateDoctor(doctor: IDoctorSummary, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Deactivate ${doctor.fullName}? They will no longer be able to log in.`,
      header: 'Deactivate Doctor',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.doctorService.deactivateDoctor(doctor.doctorId).subscribe({
          next: () => {
            this.toast.success({ detail: `${doctor.fullName} has been deactivated.` });
            this.loadDoctors();
          },
          error: () => {
            this.toast.error({ detail: 'Could not deactivate this doctor. Please try again.' });
          },
        });
      },
    });
  }
}
