import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { AuthService } from '@core/services/auth/auth.service';
import { DoctorGender, IDoctorSummary } from '@core/interfaces/doctors/doctor.interface';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { GenderOptions } from './manage-doctor.component.constants';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

@Component({
  selector: 'app-manage-doctor',
  standalone: false,
  templateUrl: './manage-doctor.component.html',
  styleUrl: './manage-doctor.component.scss',
})
export class ManageDoctorComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  doctorForm!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  doctorId!: number;
  userId!: number;
  photoBusy = false;
  photoError = '';

  createdUsername: string | null = null;
  createdEmail: string | null = null;
  createdTemporaryPassword: string | null = null;
  showTemporaryPasswordDialog = false;
  isPasswordReset = false;

  genderOptions = GenderOptions;

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.doctorId = +idParam;
        this.isEditMode = true;
        this.doctorForm.get('username')?.disable();

        this.doctorService.getDoctorById(this.doctorId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              const profile = response.content.profile;
              this.userId = profile.userId;
              this.doctorForm.patchValue({
                ...profile,
                joiningDate: profile.joiningDate ? profile.joiningDate.substring(0, 10) : null,
              });
            } else {
              this.toast.error({ detail: 'Could not load this doctor.' });
              this.router.navigate(['/doctors/doctor-list']);
            }
          },
          error: () => {
            this.toast.error({ detail: 'Could not load this doctor.' });
            this.router.navigate(['/doctors/doctor-list']);
          },
        });
      }
    });

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Doctor Management', icon: 'fa-solid fa-user-doctor', href: '/doctors/doctor-list' },
      { title: this.isEditMode ? 'Edit Doctor' : 'Add Doctor', icon: 'fa-solid fa-edit', href: '/doctors/manage-doctor' },
    ]);
  }

  private initForm(): void {
    this.doctorForm = this.fb.group({
      username: [null, [Validators.required, Validators.maxLength(100)]],
      fullName: [null, [Validators.required, Validators.maxLength(200)]],
      email: [null, [Validators.email]],
      phone: [null, [Validators.required, Validators.pattern(BD_PHONE_REGEX)]],
      department: [null],
      specialization: [null],
      qualification: [null],
      licenseNumber: [null],
      experienceYears: [null, [Validators.min(0)]],
      gender: [null],
      joiningDate: [null],
      photoBase64: [null],
      isActive: [true],
    });
  }

  get f() {
    return this.doctorForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.doctorForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.photoError = 'Please choose an image file.';
      return;
    }

    this.photoBusy = true;
    this.photoError = '';
    try {
      const dataUrl = await this.readImageAsDataUrl(file);
      this.doctorForm.patchValue({ photoBase64: dataUrl });
    } catch {
      this.photoError = 'Could not read that image — please try another file.';
    } finally {
      this.photoBusy = false;
    }
  }

  removePhoto(): void {
    this.doctorForm.patchValue({ photoBase64: null });
  }

  private readImageAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // p-datepicker emits a local Date; JSON.stringify on a Date serializes to a UTC ISO
  // datetime string, which the backend's DateOnly? binder rejects. Format locally instead.
  private toDateOnlyString(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode) {
      this.updateDoctor();
    } else {
      this.addDoctor();
    }
  }

  private addDoctor(): void {
    const formValue = this.doctorForm.getRawValue();
    this.doctorService
      .addDoctor({
        username: formValue.username,
        email: formValue.email || null,
        fullName: formValue.fullName,
        phone: formValue.phone,
        department: formValue.department,
        specialization: formValue.specialization,
        qualification: formValue.qualification,
        licenseNumber: formValue.licenseNumber,
        experienceYears: formValue.experienceYears,
        gender: formValue.gender as DoctorGender,
        joiningDate: this.toDateOnlyString(formValue.joiningDate),
        photoBase64: formValue.photoBase64,
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
            this.toast.error({ detail: 'Could not create this doctor.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
  }

  private updateDoctor(): void {
    const formValue = this.doctorForm.getRawValue();
    this.doctorService
      .updateDoctor(this.doctorId, {
        fullName: formValue.fullName,
        email: formValue.email || null,
        phone: formValue.phone,
        department: formValue.department,
        specialization: formValue.specialization,
        qualification: formValue.qualification,
        licenseNumber: formValue.licenseNumber,
        experienceYears: formValue.experienceYears,
        gender: formValue.gender as DoctorGender,
        joiningDate: this.toDateOnlyString(formValue.joiningDate),
        photoBase64: formValue.photoBase64,
        isActive: formValue.isActive,
      })
      .subscribe({
        next: (response) => {
          if (response && !response.hasError) {
            this.toast.success({ detail: 'Doctor updated successfully.' });
            this.router.navigate(['/doctors/doctor-list']);
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not update this doctor.' });
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
      message: 'Generate a new temporary password for this doctor? Their current password will stop working immediately.',
      header: 'Reset Password',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.authService.resetPassword(this.userId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              this.createdUsername = this.doctorForm.get('username')?.value;
              this.createdEmail = this.doctorForm.get('email')?.value || null;
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
      this.router.navigate(['/doctors/doctor-list']);
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
