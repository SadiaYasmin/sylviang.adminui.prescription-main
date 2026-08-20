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

  /** Staff has no own Department field — a staff member can support doctors from more
   * than one department, so it's shown read-only, derived from whichever doctors are
   * currently checked below (live, before saving — not a round trip to the backend). */
  get derivedDepartments(): string[] {
    const assignedIds: number[] = this.staffForm?.get('assignedDoctorIds')?.value || [];
    const departments = this.doctors.filter((d) => assignedIds.includes(d.doctorId)).map((d) => d.department);
    return [...new Set(departments.filter((d): d is string => !!d))].sort();
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDoctors();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.staffId = +idParam;
        this.isEditMode = true;

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
      fullName: [null, [Validators.required, Validators.maxLength(200)]],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required, Validators.pattern(BD_PHONE_REGEX)]],
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
    const control = this.staffForm.get('assignedDoctorIds');
    const current: number[] = control?.value || [];
    const next = checked ? [...current, doctorId] : current.filter((id) => id !== doctorId);
    control?.patchValue(next);
    control?.markAsDirty();
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
        // The account's login identifier is just its email — admins no longer pick a
        // separate username, matching the email-invite creation flow (no password is
        // ever issued here for the admin to hand over alongside one).
        username: formValue.email,
        email: formValue.email,
        fullName: formValue.fullName,
        phone: formValue.phone,
        assignedDoctorIds: formValue.assignedDoctorIds || [],
      })
      .subscribe({
        next: (response) => {
          if (response && !response.hasError && response.content) {
            this.toast.success({ detail: `Invite email sent to ${formValue.email}.` });
            this.router.navigate(['/staff/staff-list']);
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

  resendAccountInvite(event: Event): void {
    const email = this.staffForm.get('email')?.value;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Re-send the account setup email to ${email}? Any password they already set stops working until they use the new link.`,
      header: 'Resend Account Setup Email',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.authService.resendAccountInvite(this.userId).subscribe({
          next: (response) => {
            if (response && !response.hasError) {
              this.toast.success({ detail: `Account setup email resent to ${email}.` });
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: 'Could not resend the account setup email.' });
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
