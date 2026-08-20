import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

const RESEND_COOLDOWN_SECONDS = 60;

type Step = 'email' | 'otp' | 'newPassword' | 'done';

/**
 * Self-service password reset (anonymous). The backend always responds the same way
 * whether or not the email is registered — this UI never surfaces a distinction, so it
 * can't be used to discover which emails have accounts.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnDestroy {
  step: Step = 'email';
  isSubmitting = false;
  errorMessage: string | null = null;
  resendCountdown = 0;
  private countdownHandle: ReturnType<typeof setInterval> | null = null;

  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;

  email = '';
  private verifiedCode = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.emailForm = this.fb.group({ email: [null, [Validators.required, Validators.email]] });
    this.otpForm = this.fb.group({ code: [null, [Validators.required, Validators.pattern(/^\d{6}$/)]] });
    this.passwordForm = this.fb.group(
      {
        newPassword: [null, [Validators.required, Validators.minLength(8)]],
        confirmPassword: [null, [Validators.required]],
      },
      { validators: [passwordsMatchValidator] },
    );
  }

  ngOnDestroy(): void {
    if (this.countdownHandle) clearInterval(this.countdownHandle);
  }

  get ef() {
    return this.emailForm.controls;
  }

  get of() {
    return this.otpForm.controls;
  }

  get pf() {
    return this.passwordForm.controls;
  }

  hasError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  passwordsMismatch(): boolean {
    return this.passwordForm.hasError('mismatch') && !!this.passwordForm.get('confirmPassword')?.touched;
  }

  submitEmail(): void {
    this.errorMessage = null;
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.email = this.emailForm.getRawValue().email;
    this.isSubmitting = true;
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && !response.hasError) {
          this.step = 'otp';
          this.otpForm.reset();
          this.startCountdown();
        } else {
          this.errorMessage = response?.decentMessage || 'Something went wrong. Please try again.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.decentMessage || 'Something went wrong. Please try again.';
      },
    });
  }

  resendCode(): void {
    if (this.resendCountdown > 0) return;
    this.isSubmitting = true;
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && !response.hasError) {
          this.startCountdown();
        } else {
          this.errorMessage = response?.decentMessage || 'Could not resend the code.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.decentMessage || 'Could not resend the code.';
      },
    });
  }

  submitOtp(): void {
    this.errorMessage = null;
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const code = this.otpForm.getRawValue().code;
    this.isSubmitting = true;
    this.authService.verifyForgotPasswordOtp({ email: this.email, code }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && !response.hasError && response.content?.valid) {
          this.verifiedCode = code;
          this.step = 'newPassword';
          this.stopCountdown();
        } else {
          this.errorMessage = 'That code is invalid or expired.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.decentMessage || 'That code is invalid or expired.';
      },
    });
  }

  submitNewPassword(): void {
    this.errorMessage = null;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const newPassword = this.passwordForm.getRawValue().newPassword;
    this.authService.resetPasswordWithOtp({ email: this.email, code: this.verifiedCode, newPassword }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && !response.hasError) {
          this.step = 'done';
        } else {
          this.errorMessage = response?.decentMessage || 'Could not reset your password. Please start over.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.decentMessage || 'Could not reset your password. Please start over.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private startCountdown(): void {
    this.resendCountdown = RESEND_COOLDOWN_SECONDS;
    if (this.countdownHandle) clearInterval(this.countdownHandle);
    this.countdownHandle = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0 && this.countdownHandle) clearInterval(this.countdownHandle);
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownHandle) clearInterval(this.countdownHandle);
    this.resendCountdown = 0;
  }
}

function passwordsMatchValidator(group: FormGroup) {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword ? { mismatch: true } : null;
}
