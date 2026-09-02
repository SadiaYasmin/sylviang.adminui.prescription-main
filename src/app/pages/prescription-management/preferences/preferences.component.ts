import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IDoctorPreferences } from '@core/interfaces/doctor-preferences/doctor-preferences.interface';
import { IHospitalSettings } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { ITemplateDetails, TemplateLanguage } from '@core/interfaces/templates/template.interface';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { BreadcrumbService } from '@app/@core/services';
import { ToastService } from '@core/services/misc/toast.service';
import { TemplateService } from '@core/services/templates/template.service';

/**
 * A doctor's prescription-specific settings (Epic K, US-063-065): preferred template
 * (with a live preview per option) and a read-only display of the last-used prescription
 * language. Signature and personal profile fields (name/phone/email/photo/etc.) live on
 * the shared My Profile page instead — see ProfileComponent.
 */
@Component({
  selector: 'app-preferences',
  standalone: false,
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
})
export class PreferencesComponent implements OnInit {
  preferences: IDoctorPreferences | null = null;
  templates: ITemplateDetails[] = [];
  hospitalSettings: IHospitalSettings | null = null;
  loading = true;
  saving = false;

  constructor(
    private doctorPreferencesService: DoctorPreferencesService,
    private templateService: TemplateService,
    private hospitalSettingsService: HospitalSettingsService,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Prescriptions', icon: 'fa-solid fa-file-prescription', href: '/prescriptions' },
      { title: 'Prescription Preferences', icon: 'fa-solid fa-gear', href: '/prescriptions/preferences' },
    ]);

    this.hospitalSettingsService.get().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.hospitalSettings = response.content;
        }
      },
      error: () => {
        // Previews simply render without hospital branding if this fails.
      },
    });

    this.templateService.getList(true).subscribe((res) => {
      const summaries = res.content.templates;
      if (!summaries.length) {
        this.loading = false;
        return;
      }
      forkJoin(summaries.map((t) => this.templateService.getById(t.templateId).pipe(catchError(() => of(null))))).subscribe((responses) => {
        this.templates = responses
          .filter((r): r is ApiResponse<ITemplateDetails> => !!r && !r.hasError && !!r.content)
          .map((r) => r.content);
      });
    });

    this.doctorPreferencesService.get().subscribe({
      next: (res) => {
        this.preferences = res.content;
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

  langCode(language: TemplateLanguage): 'en' | 'bn' {
    return language === 'Bn' ? 'bn' : 'en';
  }
}
