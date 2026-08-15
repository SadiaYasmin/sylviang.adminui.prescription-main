import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbService } from '@app/@core/services';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { ToastService } from '@core/services/misc/toast.service';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';

@Component({
  selector: 'app-hospital-settings',
  standalone: false,
  templateUrl: './hospital-settings.component.html',
  styleUrl: './hospital-settings.component.scss',
})
export class HospitalSettingsComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private hospitalSettingsService: HospitalSettingsService,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
  ) {}

  settingsForm!: FormGroup;
  loading = false;
  saving = false;
  formSubmitted = false;

  logoBusy = false;
  logoError = '';
  sealBusy = false;
  sealError = '';

  // US-083: the GET response now returns a stored URL (logoUrl/sealUrl), not the base64
  // the update request needs — so the preview is tracked separately from the form's
  // logoBase64/sealBase64 controls, which stay null ("leave unchanged") until the user
  // actually picks a new file.
  currentLogoUrl: string | null = null;
  currentSealUrl: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadSettings();

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Prescription Templates', icon: 'fa-solid fa-file-medical', href: '/templates/template-list' },
      { title: 'Hospital Settings', icon: 'fa-solid fa-hospital', href: '/templates/hospital-settings' },
    ]);
  }

  private initForm(): void {
    this.settingsForm = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(200)]],
      logoBase64: [null],
      address: [null, Validators.required],
      phone: [null, Validators.required],
      emergencyNumber: [null],
      email: [null, [Validators.email]],
      website: [null],
      slogan: [null],
      sloganBn: [null],
      licenseNumber: [null],
      sealBase64: [null],
    });
  }

  get f() {
    return this.settingsForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  private loadSettings(): void {
    this.loading = true;
    this.hospitalSettingsService.get().subscribe({
      next: (response) => {
        this.loading = false;
        if (response && !response.hasError && response.content) {
          this.settingsForm.patchValue(response.content);
          this.currentLogoUrl = resolveAssetUrl(response.content.logoUrl);
          this.currentSealUrl = resolveAssetUrl(response.content.sealUrl);
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not load hospital settings.' });
        }
      },
      error: () => {
        this.loading = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.logoError = 'Please choose an image file.';
      return;
    }

    this.logoBusy = true;
    this.logoError = '';
    try {
      const dataUrl = await this.readImageAsDataUrl(file);
      this.settingsForm.patchValue({ logoBase64: dataUrl });
      this.currentLogoUrl = dataUrl;
      this.settingsForm.markAsDirty();
    } catch {
      this.logoError = 'Could not read that image — please try another file.';
    } finally {
      this.logoBusy = false;
    }
  }

  removeLogo(): void {
    // '' (not null) is the explicit "remove" signal — null means "leave unchanged" so a
    // form save that doesn't touch the logo can't accidentally wipe it (see
    // UpdateHospitalSettingsHandler).
    this.settingsForm.patchValue({ logoBase64: '' });
    this.currentLogoUrl = null;
    this.settingsForm.markAsDirty();
  }

  async onSealSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.sealError = 'Please choose an image file.';
      return;
    }

    this.sealBusy = true;
    this.sealError = '';
    try {
      const dataUrl = await this.readImageAsDataUrl(file);
      this.settingsForm.patchValue({ sealBase64: dataUrl });
      this.currentSealUrl = dataUrl;
      this.settingsForm.markAsDirty();
    } catch {
      this.sealError = 'Could not read that image — please try another file.';
    } finally {
      this.sealBusy = false;
    }
  }

  removeSeal(): void {
    this.settingsForm.patchValue({ sealBase64: '' });
    this.currentSealUrl = null;
    this.settingsForm.markAsDirty();
  }

  private readImageAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const value = this.settingsForm.getRawValue();
    this.hospitalSettingsService.update(value).subscribe({
      next: (response) => {
        this.saving = false;
        if (response && !response.hasError) {
          this.toast.success({ detail: 'Hospital settings updated.' });
          this.settingsForm.markAsPristine();
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not update hospital settings.' });
        }
      },
      error: () => {
        this.saving = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }
}
