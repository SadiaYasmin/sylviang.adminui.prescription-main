import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BreadcrumbService } from '@app/@core/services';
import { UI_CONFIG } from '@app/@core/constants';
import { IStaffSummary } from '@core/interfaces/staff/staff.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { DepartmentService } from '@core/services/departments/department.service';
import { ToastService } from '@core/services/misc/toast.service';
import { StaffService } from '@core/services/staff/staff.service';
import { ConfirmationService } from 'primeng/api';
import { StaffListColumns } from './staff-list.component.constants';

@Component({
  selector: 'app-staff-list',
  standalone: false,
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss',
})
export class StaffListComponent implements OnInit {
  constructor(
    private staffService: StaffService,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
    private breadcrumbService: BreadcrumbService,
  ) {}

  staff: IStaffSummary[] = [];
  loading = false;
  totalRecords = 0;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  searchTerm = '';
  departmentFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  departmentOptions: { label: string; value: string }[] = [];

  columns = StaffListColumns;

  // A Doctor only sees their own assigned-to-me roster: read-only, no filters
  // beyond search, no add/edit/deactivate actions, no pagination controls.
  isDoctorView = this.authService.getRole() === 'Doctor';

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ title: 'Staff Management', icon: 'fa-solid fa-users', href: '/staff/staff-list' }]);
    this.loadStaff();
    if (!this.isDoctorView) {
      this.loadDepartments();
    }
  }

  private loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (response) => {
        const departments = !response.hasError && response.content ? response.content : [];
        this.departmentOptions = departments.filter((d) => d.isActive).map((d) => ({ label: d.name, value: d.name }));
      },
    });
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadStaff();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.departmentFilter = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading = true;

    const request$ = this.isDoctorView
      ? this.staffService.getAssignedToMe(this.searchTerm || undefined)
      : this.staffService.getStaff({
          page: this.currentPage,
          pageSize: this.rows,
          searchTerm: this.searchTerm || undefined,
          department: this.departmentFilter || undefined,
          isActive: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
        });

    request$.subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.staff = response.content.staff || [];
          this.totalRecords = response.content.totalCount || 0;
        } else {
          this.staff = [];
          this.totalRecords = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.staff = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadStaff();
  }

  deactivateStaff(staff: IStaffSummary, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Deactivate ${staff.fullName}? They will no longer be able to log in.`,
      header: 'Deactivate Staff',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.staffService.deactivateStaff(staff.staffId).subscribe({
          next: () => {
            this.toast.success({ detail: `${staff.fullName} has been deactivated.` });
            this.loadStaff();
          },
          error: () => {
            this.toast.error({ detail: 'Could not deactivate this staff member. Please try again.' });
          },
        });
      },
    });
  }
}
