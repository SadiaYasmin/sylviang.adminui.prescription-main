import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IDoctorPreferences, IDoctorProfile } from '@core/interfaces/doctor-preferences/doctor-preferences.interface';
import { ITemplateSummary } from '@core/interfaces/templates/template.interface';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { ToastService } from '@core/services/misc/toast.service';
import { SignatureProcessingService } from '@core/services/signature-processing/signature-processing.service';
import { TemplateService } from '@core/services/templates/template.service';
import { readImageAsDataUrl, validateImageFile } from '@app/shared/utils/image-upload.util';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

type SignatureState = 'idle' | 'processing' | 'success' | 'error';

/**
 * A doctor's full self-service profile & preferences (Epic K, US-061-065): personal profile
 * fields, profile photo, signature upload with automatic background removal, preferred
 * template, and read-only display of the last-used prescription language.
 */
@Component({
  selector: 'app-preferences',
  standalone: false,
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
})
export class PreferencesComponent implements OnInit {
  preferences: IDoctorPreferences | null = null;
  profile: IDoctorProfile | null = null;
  profileForm!: FormGroup;
  templates: ITemplateSummary[] = [];
  loading = true;
  saving = false;
  savingProfile = false;

  signaturePreview: string | null = null;
  signatureState: SignatureState = 'idle';
  signatureError = '';
  private pendingSignatureFile: File | null = null;

  photoBusy = false;
  photoError = '';

  constructor(
    private fb: FormBuilder,
    private doctorPreferencesService: DoctorPreferencesService,
    private signatureProcessingService: SignatureProcessingService,
    private templateService: TemplateService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.templateService.getList(true).subscribe((res) => (this.templates = res.content.templates));

    this.doctorPreferencesService.get().subscribe({
      next: (res) => {
        this.preferences = res.content;
        this.signaturePreview = res.content.signatureBase64;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    this.doctorPreferencesService.getProfile().subscribe({
      next: (res) => {
        if (!res.hasError && res.content) {
          this.profile = res.content;
          this.profileForm.patchValue(res.content);
        }
      },
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      fullName: [null, [Validators.required, Validators.maxLength(200)]],
      qualification: [null],
      department: [null],
      licenseNumber: [null],
      phone: [null, [Validators.required, Validators.pattern(BD_PHONE_REGEX)]],
      email: [null, [Validators.email]],
    });
  }

  get f() {
    return this.profileForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.doctorPreferencesService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (response) => {
        this.savingProfile = false;
        if (response && !response.hasError && response.content) {
          this.profile = response.content;
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
            this.profile = response.content;
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
          this.profile = response.content;
        }
      },
      error: () => {
        this.photoBusy = false;
      },
    });
  }

  selectTemplate(templateId: number): void {
    if (!this.preferences) return;
    this.saving = true;
    this.doctorPreferencesService.update({ preferredTemplateId: templateId, preferredLanguage: this.preferences.preferredLanguage }).subscribe({
      next: (res) => {
        this.preferences = res.content;
        this.saving = false;
        this.toast.success({ detail: 'Preferred template updated.' });
      },
      error: () => (this.saving = false),
    });
  }

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

      this.saving = true;
      await new Promise<void>((resolve) => {
        this.doctorPreferencesService.updateSignature({ signatureBase64: base64 }).subscribe({
          next: (res) => {
            this.preferences = res.content;
            this.signaturePreview = res.content.signatureBase64;
            this.saving = false;
            this.signatureState = 'success';
            this.pendingSignatureFile = null;
            this.toast.success({ detail: 'Signature updated.' });
            resolve();
          },
          error: () => {
            this.saving = false;
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
}
