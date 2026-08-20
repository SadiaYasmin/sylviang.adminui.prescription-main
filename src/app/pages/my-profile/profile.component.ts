import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbService } from '@app/@core/services';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';
import { readImageAsDataUrl, validateImageFile } from '@app/shared/utils/image-upload.util';
import { ICurrentUserDetails } from '@core/interfaces/auth/auth.interface';
import { IDepartment } from '@core/interfaces/departments/department.interface';
import { IDoctorPreferences, IDoctorProfile } from '@core/interfaces/doctor-preferences/doctor-preferences.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { DepartmentService } from '@core/services/departments/department.service';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { ToastService } from '@core/services/misc/toast.service';
import { SignatureProcessingService } from '@core/services/signature-processing/signature-processing.service';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
const RESEND_COOLDOWN_SECONDS = 60;

type ChangeStep = 'idle' | 'codeSent';
type SignatureState = 'idle' | 'processing' | 'success' | 'error';

@Component({
  selector: 'app-my-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private doctorPreferencesService: DoctorPreferencesService,
    private departmentService: DepartmentService,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
    private signatureProcessingService: SignatureProcessingService,
  ) {}

  readonly resolveAssetUrl = resolveAssetUrl;

  loading = true;
  currentUser: ICurrentUserDetails | null = null;

  // ===== Doctor-only profile fields (name/phone/qualification/department/license/photo) =====
  isDoctor = false;
  doctorProfile: IDoctorProfile | null = null;
  profileForm!: FormGroup;
  savingProfile = false;
  departmentOptions: IDepartment[] = [];
  photoBusy = false;
  photoError = '';

  // ===== Signature (US-063) =====
  preferences: IDoctorPreferences | null = null;
  signaturePreview: string | null = null;
  signatureState: SignatureState = 'idle';
  signatureError = '';
  signatureBusy = false;
  private pendingSignatureFile: File | null = null;

  // ===== Change email =====
  emailStep: ChangeStep = 'idle';
  emailForm!: FormGroup;
  emailCodeForm!: FormGroup;
  emailBusy = false;
  emailResendCountdown = 0;
  private emailCountdownHandle: ReturnType<typeof setInterval> | null = null;

  // ===== Change password =====
  passwordStep: ChangeStep = 'idle';
  passwordCodeForm!: FormGroup;
  passwordBusy = false;
  passwordResendCountdown = 0;
  private passwordCountdownHandle: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.emailForm = this.fb.group({ newEmail: [null, [Validators.required, Validators.email]] });
    this.emailCodeForm = this.fb.group({ code: [null, [Validators.required, Validators.pattern(/^\d{6}$/)]] });
    this.passwordCodeForm = this.fb.group(
      {
        code: [null, [Validators.required, Validators.pattern(/^\d{6}$/)]],
        newPassword: [null, [Validators.required, Validators.minLength(8)]],
        confirmPassword: [null, [Validators.required]],
      },
      { validators: [passwordsMatchValidator] },
    );

    this.breadcrumbService.setBreadcrumbs([{ title: 'My Profile', icon: 'fa-solid fa-id-badge', href: '/my-profile' }]);

    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.currentUser = response.content;
          this.isDoctor = this.currentUser.role === 'Doctor';
          this.emailForm.patchValue({ newEmail: this.currentUser.email });
          if (this.isDoctor) {
            this.loadDoctorProfile();
          } else {
            this.loading = false;
          }
        } else {
          this.loading = false;
        }
      },
      error: () => (this.loading = false),
    });
  }

  ngOnDestroy(): void {
    if (this.emailCountdownHandle) clearInterval(this.emailCountdownHandle);
    if (this.passwordCountdownHandle) clearInterval(this.passwordCountdownHandle);
  }

  // ===== Doctor profile =====

  private loadDoctorProfile(): void {
    this.profileForm = this.fb.group({
      fullName: [null, [Validators.required, Validators.maxLength(200)]],
      phone: [null, [Validators.required, Validators.pattern(BD_PHONE_REGEX)]],
      qualification: [null],
      department: [null],
      licenseNumber: [null],
    });

    this.departmentService.getAll().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.departmentOptions = response.content.filter((d) => d.isActive);
        }
      },
    });

    this.doctorPreferencesService.getProfile().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.doctorProfile = response.content;
          this.profileForm.patchValue(response.content);
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    // License number is Admin-only (uniqueness is enforced there) — a doctor can view it but never edit it here.
    this.profileForm.get('licenseNumber')?.disable();

    this.doctorPreferencesService.get().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.preferences = response.content;
          this.signaturePreview = resolveAssetUrl(response.content.signatureUrl);
        }
      },
    });
  }

  get pf() {
    return this.profileForm.controls;
  }

  hasProfileError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.doctorPreferencesService
      .updateProfile({
        ...this.profileForm.getRawValue(),
        // Email changes go through the verified change-email flow below, never this form.
        email: this.doctorProfile?.email ?? null,
      })
      .subscribe({
        next: (response) => {
          this.savingProfile = false;
          if (response && !response.hasError && response.content) {
            this.doctorProfile = response.content;
            this.toast.success({ detail: 'Profile updated successfully.' });
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not update your profile.' });
          }
        },
        error: () => {
          this.savingProfile = false;
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.ok) {
      this.photoError = validation.reason || 'Please choose an image file.';
      return;
    }

    this.photoBusy = true;
    this.photoError = '';
    try {
      const dataUrl = await readImageAsDataUrl(file);
      this.doctorPreferencesService.updatePhoto({ photoBase64: dataUrl }).subscribe({
        next: (response) => {
          this.photoBusy = false;
          if (response && !response.hasError && response.content) {
            this.doctorProfile = response.content;
            this.toast.success({ detail: 'Photo updated.' });
          }
        },
        error: () => {
          this.photoBusy = false;
        },
      });
    } catch {
      this.photoBusy = false;
      this.photoError = 'Could not read that image — please try another file.';
    }
  }

  removePhoto(): void {
    this.photoBusy = true;
    this.doctorPreferencesService.removePhoto().subscribe({
      next: (response) => {
        this.photoBusy = false;
        if (response && !response.hasError && response.content) {
          this.doctorProfile = response.content;
        }
      },
      error: () => {
        this.photoBusy = false;
      },
    });
  }

  // ===== Signature =====

  async onSignatureSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.ok) {
      // Invalid uploads are rejected up front and never sent to the API (US-063).
      this.toast.error({ detail: validation.reason || 'Please choose an image file.' });
      return;
    }

    this.pendingSignatureFile = file;
    await this.processSignature(file);
  }

  async retrySignature(): Promise<void> {
    if (!this.pendingSignatureFile) return;
    await this.processSignature(this.pendingSignatureFile);
  }

  private async processSignature(file: File): Promise<void> {
    this.signatureState = 'processing';
    this.signatureError = '';

    try {
      const blob = await this.signatureProcessingService.removeBackground(file);
      const base64 = await this.signatureProcessingService.blobToDataUrl(blob);

      this.signatureBusy = true;
      await new Promise<void>((resolve) => {
        this.doctorPreferencesService.updateSignature({ signatureBase64: base64 }).subscribe({
          next: (res) => {
            this.preferences = res.content;
            this.signaturePreview = resolveAssetUrl(res.content.signatureUrl);
            this.signatureBusy = false;
            this.signatureState = 'success';
            this.pendingSignatureFile = null;
            this.toast.success({ detail: 'Signature updated.' });
            resolve();
          },
          error: () => {
            this.signatureBusy = false;
            this.signatureState = 'error';
            this.signatureError = 'Could not save the processed signature. Please try again.';
            resolve();
          },
        });
      });
    } catch (err) {
      // The original file preview stays available (pendingSignatureFile is retained) so
      // Retry can re-run processing without asking the doctor to re-upload (US-063).
      this.signatureState = 'error';
      this.signatureError = (err as Error).message || 'Could not process that signature image.';
    }
  }

  // ===== Change email =====

  requestEmailChange(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.emailBusy = true;
    const newEmail = this.emailForm.getRawValue().newEmail;
    this.authService.requestEmailChange({ newEmail }).subscribe({
      next: (response) => {
        this.emailBusy = false;
        if (response && !response.hasError) {
          this.emailStep = 'codeSent';
          this.emailCodeForm.reset();
          this.toast.success({ detail: `A confirmation code was sent to ${newEmail}.` });
          this.startCountdown('email');
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not send a confirmation code.' });
        }
      },
      error: () => {
        this.emailBusy = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast (e.g. the 60s cooldown).
      },
    });
  }

  confirmEmailChange(): void {
    if (this.emailCodeForm.invalid) {
      this.emailCodeForm.markAllAsTouched();
      return;
    }

    this.emailBusy = true;
    this.authService.confirmEmailChange({ code: this.emailCodeForm.getRawValue().code }).subscribe({
      next: (response) => {
        this.emailBusy = false;
        if (response && !response.hasError) {
          if (this.currentUser) this.currentUser.email = this.emailForm.getRawValue().newEmail;
          if (this.doctorProfile) this.doctorProfile.email = this.emailForm.getRawValue().newEmail;
          this.emailStep = 'idle';
          this.toast.success({ detail: 'Email address updated.' });
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'That code is invalid or expired.' });
        }
      },
      error: () => {
        this.emailBusy = false;
      },
    });
  }

  cancelEmailChange(): void {
    this.emailStep = 'idle';
    this.emailForm.patchValue({ newEmail: this.currentUser?.email });
    this.stopCountdown('email');
  }

  // ===== Change password =====

  requestPasswordChange(): void {
    this.passwordBusy = true;
    this.authService.requestPasswordChange().subscribe({
      next: (response) => {
        this.passwordBusy = false;
        if (response && !response.hasError) {
          this.passwordStep = 'codeSent';
          this.passwordCodeForm.reset();
          this.toast.success({ detail: `A confirmation code was sent to ${this.currentUser?.email}.` });
          this.startCountdown('password');
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not send a confirmation code.' });
        }
      },
      error: () => {
        this.passwordBusy = false;
      },
    });
  }

  confirmPasswordChange(): void {
    if (this.passwordCodeForm.invalid) {
      this.passwordCodeForm.markAllAsTouched();
      return;
    }

    this.passwordBusy = true;
    const { code, newPassword } = this.passwordCodeForm.getRawValue();
    this.authService.confirmPasswordChange({ code, newPassword }).subscribe({
      next: (response) => {
        this.passwordBusy = false;
        if (response && !response.hasError) {
          this.passwordStep = 'idle';
          this.toast.success({ detail: 'Password changed. Use it next time you log in.' });
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'That code is invalid or expired.' });
        }
      },
      error: () => {
        this.passwordBusy = false;
      },
    });
  }

  cancelPasswordChange(): void {
    this.passwordStep = 'idle';
    this.stopCountdown('password');
  }

  hasCodeError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  passwordsMismatch(): boolean {
    return this.passwordCodeForm.hasError('mismatch') && !!this.passwordCodeForm.get('confirmPassword')?.touched;
  }

  // ===== Resend cooldown =====

  private startCountdown(which: 'email' | 'password'): void {
    if (which === 'email') {
      this.emailResendCountdown = RESEND_COOLDOWN_SECONDS;
      if (this.emailCountdownHandle) clearInterval(this.emailCountdownHandle);
      this.emailCountdownHandle = setInterval(() => {
        this.emailResendCountdown--;
        if (this.emailResendCountdown <= 0 && this.emailCountdownHandle) clearInterval(this.emailCountdownHandle);
      }, 1000);
    } else {
      this.passwordResendCountdown = RESEND_COOLDOWN_SECONDS;
      if (this.passwordCountdownHandle) clearInterval(this.passwordCountdownHandle);
      this.passwordCountdownHandle = setInterval(() => {
        this.passwordResendCountdown--;
        if (this.passwordResendCountdown <= 0 && this.passwordCountdownHandle) clearInterval(this.passwordCountdownHandle);
      }, 1000);
    }
  }

  private stopCountdown(which: 'email' | 'password'): void {
    if (which === 'email' && this.emailCountdownHandle) {
      clearInterval(this.emailCountdownHandle);
      this.emailResendCountdown = 0;
    } else if (which === 'password' && this.passwordCountdownHandle) {
      clearInterval(this.passwordCountdownHandle);
      this.passwordResendCountdown = 0;
    }
  }
}

function passwordsMatchValidator(group: FormGroup) {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword ? { mismatch: true } : null;
}
