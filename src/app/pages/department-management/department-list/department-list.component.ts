import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbService } from '@app/@core/services';
import { IDepartment } from '@core/interfaces/departments/department.interface';
import { DepartmentService } from '@core/services/departments/department.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-department-list',
  standalone: false,
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss',
})
export class DepartmentListComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private breadcrumbService: BreadcrumbService,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  departments: IDepartment[] = [];
  loading = false;

  /** Small client-side filters — the department list isn't paginated from the backend (it's
   * always a short, fully-loaded list), so a search endpoint would be overkill here. */
  searchTerm = '';
  statusFilter: 'All' | 'Active' | 'Inactive' = 'All';
  readonly statusFilterOptions: { label: string; value: 'All' | 'Active' | 'Inactive' }[] = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  get filteredDepartments(): IDepartment[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.departments.filter((d) => {
      const matchesTerm = !term || d.name.toLowerCase().includes(term);
      const matchesStatus = this.statusFilter === 'All' || d.isActive === (this.statusFilter === 'Active');
      return matchesTerm && matchesStatus;
    });
  }

  form!: FormGroup;
  formSubmitted = false;
  showDialog = false;
  editingDepartment: IDepartment | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(100)]],
      isActive: [true],
    });

    this.breadcrumbService.setBreadcrumbs([{ title: 'Departments', icon: 'fa-solid fa-building', href: '/departments' }]);

    this.load();
  }

  load(): void {
    this.loading = true;
    this.departmentService.getAll().subscribe({
      next: (response) => {
        this.departments = response && !response.hasError && response.content ? response.content : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get f() {
    return this.form.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  openCreate(): void {
    this.editingDepartment = null;
    this.formSubmitted = false;
    this.form.reset({ name: null, isActive: true });
    this.showDialog = true;
  }

  openEdit(department: IDepartment): void {
    this.editingDepartment = department;
    this.formSubmitted = false;
    this.form.reset({ name: department.name, isActive: department.isActive });
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
  }

  save(): void {
    this.formSubmitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.editingDepartment) {
      this.departmentService.update(this.editingDepartment.departmentId, { name: value.name, isActive: value.isActive }).subscribe({
        next: (response) => {
          if (response && !response.hasError) {
            this.toast.success({ detail: 'Department updated.' });
            this.showDialog = false;
            this.load();
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not update this department.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
    } else {
      this.departmentService.create({ name: value.name }).subscribe({
        next: (response) => {
          if (response && !response.hasError) {
            this.toast.success({ detail: 'Department added.' });
            this.showDialog = false;
            this.load();
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not add this department.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
    }
  }

  deactivate(department: IDepartment, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Deactivate ${department.name}? It will no longer appear as an option when creating or editing a doctor/staff member.`,
      header: 'Deactivate Department',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.departmentService.deactivate(department.departmentId).subscribe({
          next: (response) => {
            if (response && !response.hasError) {
              this.toast.success({ detail: `${department.name} deactivated.` });
              this.load();
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: 'Could not deactivate this department.' });
            }
          },
          error: () => {
            // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
          },
        });
      },
    });
  }
}
