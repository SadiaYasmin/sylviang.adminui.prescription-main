import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { AuthService } from '@core/services/auth/auth.service';
import { IDoctorSummary } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { StaffService } from '@core/services/staff/staff.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

@Component({
  selector: 'app-manage-staff',
  standalone: false,
  templateUrl: './manage-staff.component.html',
  styleUrl: './manage-staff.component.scss',
})
export class ManageStaffComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  staffForm!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  staffId!: number;
  userId!: number;

  doctors: IDoctorSummary[] = [];

  createdUsername: string | null = null;
  createdEmail: string | null = null;
  createdTemporaryPassword: string | null = null;
  showTemporaryPasswordDialog = false;
  isPasswordReset = false;

  ngOnInit(): void {
    this.initForm();
    this.loadDoctors();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.staffId = +idParam;
        this.isEditMode = true;
        this.staffForm.get('username')?.disable();

        this.staffService.getStaffById(this.staffId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              const profile = response.content.profile;
              this.userId = profile.userId;
              this.staffForm.patchValue({
                ...profile,
                assignedDoctorIds: profile.assignedDoctors.map((d) => d.doctorId),
              });
            } else {
              this.toast.error({ detail: 'Could not load this staff member.' });
              this.router.navigate(['/staff/staff-list']);
            }
          },
          error: () => {
            this.toast.error({ detail: 'Could not load this staff member.' });
            this.router.navigate(['/staff/staff-list']);
          },
        });
      }
    });

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Staff Management', icon: 'fa-solid fa-users', href: '/staff/staff-list' },
      { title: this.isEditMode ? 'Edit Staff' : 'Add Staff', icon: 'fa-solid fa-edit', href: '/staff/manage-staff' },
    ]);
  }

  private initForm(): void {
    this.staffForm = this.fb.group({
      username: [null, [Validators.required, Validators.maxLength(100)]],
      fullName: [null, [Validators.required, Validators.maxLength(200)]],
      email: [null, [Validators.email]],
      phone: [null, [Validators.required, Validators.pattern(BD_PHONE_REGEX)]],
      department: [null],
      assignedDoctorIds: [[]],
      isActive: [true],
    });
  }

  private loadDoctors(): void {
    this.doctorService.getDoctors({ pageSize: 100, isActive: true }).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.doctors = response.content.doctors || [];
        }
      },
    });
  }

  get f() {
    return this.staffForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.staffForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  toggleDoctor(doctorId: number, checked: boolean): void {
    const current: number[] = this.staffForm.get('assignedDoctorIds')?.value || [];
    const next = checked ? [...current, doctorId] : current.filter((id) => id !== doctorId);
    this.staffForm.patchValue({ assignedDoctorIds: next });
  }

  isDoctorAssigned(doctorId: number): boolean {
    const current: number[] = this.staffForm.get('assignedDoctorIds')?.value || [];
    return current.includes(doctorId);
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode) {
      this.updateStaff();
    } else {
      this.addStaff();
    }
  }

  private addStaff(): void {
    const formValue = this.staffForm.getRawValue();
    this.staffService
      .addStaff({
        username: formValue.username,
        email: formValue.email || null,
        fullName: formValue.fullName,
        phone: formValue.phone,
        department: formValue.department,
        assignedDoctorIds: formValue.assignedDoctorIds || [],
      })
      .subscribe({
        next: (response) => {
          if (response && !response.hasError && response.content) {
            this.createdUsername = response.content.username;
            this.createdEmail = formValue.email || null;
            this.createdTemporaryPassword = response.content.temporaryPassword;
            this.isPasswordReset = false;
            this.showTemporaryPasswordDialog = true;
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not create this staff member.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
  }

  private updateStaff(): void {
    const formValue = this.staffForm.getRawValue();
    this.staffService
      .updateStaff(this.staffId, {
        fullName: formValue.fullName,
        email: formValue.email || null,
        phone: formValue.phone,
        department: formValue.department,
        assignedDoctorIds: formValue.assignedDoctorIds || [],
        isActive: formValue.isActive,
      })
      .subscribe({
        next: (response) => {
          if (response && !response.hasError) {
            this.toast.success({ detail: 'Staff member updated successfully.' });
            this.router.navigate(['/staff/staff-list']);
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not update this staff member.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
  }

  resetPassword(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Generate a new temporary password for this staff member? Their current password will stop working immediately.',
      header: 'Reset Password',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.authService.resetPassword(this.userId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              this.createdUsername = this.staffForm.get('username')?.value;
              this.createdEmail = this.staffForm.get('email')?.value || null;
              this.createdTemporaryPassword = response.content.temporaryPassword;
              this.isPasswordReset = true;
              this.showTemporaryPasswordDialog = true;
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: 'Could not reset this password.' });
            }
          },
          error: () => {
            // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
          },
        });
      },
    });
  }

  onTemporaryPasswordDialogClose(): void {
    this.showTemporaryPasswordDialog = false;
    if (!this.isPasswordReset) {
      this.router.navigate(['/staff/staff-list']);
    }
  }

  copyCredentials(): void {
    if (!this.createdTemporaryPassword) return;

    const lines = [`Username: ${this.createdUsername}`];
    if (this.createdEmail) lines.push(`Email: ${this.createdEmail}`);
    lines.push(`Temporary password: ${this.createdTemporaryPassword}`);

    navigator.clipboard?.writeText(lines.join('\n'));
    this.toast.info({ detail: 'Credentials copied to clipboard.' });
  }
}
