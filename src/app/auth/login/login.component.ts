import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  formSubmitted = false;
  isSubmitting = false;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      username: [null, [Validators.required, this.noWhitespaceOnly.bind(this)]],
      password: [null, [Validators.required]],
    });
  }

  private noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string' && control.value.trim().length === 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }

  get f() {
    return this.loginForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName === 'username' ? 'Email' : 'Password'} is required`;
      if (field.errors['whitespaceOnly']) return 'Email cannot be whitespace only';
    }
    return '';
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.loginError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (!response.hasError) {
          // Admin has no Dashboard — lands on Analytics & Reports instead (see role.guard.ts).
          const role = this.authService.getRole();
          this.router.navigate([role === 'Admin' ? '/analytics' : '/dashboard']);
        } else {
          this.loginError = response.decentMessage || 'Invalid email or password.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.loginError = error?.error?.decentMessage || 'Invalid email or password.';
      },
    });
  }
}
