import { Component, OnInit } from '@angular/core';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { TemplateService } from '@core/services/templates/template.service';
import { ToastService } from '@core/services/misc/toast.service';
import { IDoctorPreferences } from '@core/interfaces/doctor-preferences/doctor-preferences.interface';
import { ITemplateSummary } from '@core/interfaces/templates/template.interface';

/**
 * Epic K stub, added by Epic D to unblock the finalize checklist (US-026): a doctor picks
 * a preferred template and uploads a signature — not the full profile page (photo/license
 * edit, AI background removal are still Epic K's own job).
 */
@Component({
  selector: 'app-preferences',
  standalone: false,
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
})
export class PreferencesComponent implements OnInit {
  preferences: IDoctorPreferences | null = null;
  templates: ITemplateSummary[] = [];
  loading = true;
  saving = false;
  signaturePreview: string | null = null;

  constructor(
    private doctorPreferencesService: DoctorPreferencesService,
    private templateService: TemplateService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.templateService.getList(true).subscribe((res) => (this.templates = res.content.templates));
    this.doctorPreferencesService.get().subscribe({
      next: (res) => {
        this.preferences = res.content;
        this.signaturePreview = res.content.signatureBase64;
        this.loading = false;
      },
      error: () => (this.loading = false),
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

  onSignatureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error({ detail: 'Please choose an image file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.saving = true;
      this.doctorPreferencesService.updateSignature({ signatureBase64: base64 }).subscribe({
        next: (res) => {
          this.preferences = res.content;
          this.signaturePreview = res.content.signatureBase64;
          this.saving = false;
          this.toast.success({ detail: 'Signature updated.' });
        },
        error: () => (this.saving = false),
      });
    };
    reader.readAsDataURL(file);
  }
}
