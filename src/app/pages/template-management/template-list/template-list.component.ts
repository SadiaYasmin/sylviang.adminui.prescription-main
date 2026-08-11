import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IHospitalSettings } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { ITemplateDetails, ITemplateSummary } from '@core/interfaces/templates/template.interface';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TemplateService } from '@core/services/templates/template.service';
import { ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-template-list',
  standalone: false,
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss',
})
export class TemplateListComponent implements OnInit {
  constructor(
    private templateService: TemplateService,
    private hospitalSettingsService: HospitalSettingsService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  templates: ITemplateDetails[] = [];
  hospitalSettings: IHospitalSettings | null = null;
  loading = false;

  get skeletonItems() {
    return Array(3)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.hospitalSettingsService.get().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.hospitalSettings = response.content;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Cards can still render (without branding) if this fails.
      },
    });

    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getList().subscribe({
      next: (response) => {
        const summaries: ITemplateSummary[] = !response.hasError && response.content ? response.content.templates || [] : [];
        if (summaries.length === 0) {
          this.templates = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // The list endpoint returns summaries only; fetch full config per template
        // (the list is small/unpaginated by design) so each card can render a real
        // thumbnail preview instead of just text.
        forkJoin(
          summaries.map((summary) =>
            this.templateService.getById(summary.templateId).pipe(
              catchError(() => of(null)),
            ),
          ),
        ).subscribe((responses) => {
          this.templates = responses
            .map((response) => (response && !response.hasError && response.content ? response.content : null))
            .filter((details): details is ITemplateDetails => !!details)
            .sort((a, b) => Number(b.isSystemDefault) - Number(a.isSystemDefault) || a.name.localeCompare(b.name));
          if (this.templates.length !== summaries.length) {
            // Some detail fetches failed silently; fall back to at least showing summaries.
            const loadedIds = new Set(this.templates.map((t) => t.templateId));
            const missing = summaries.filter((s) => !loadedIds.has(s.templateId));
            if (missing.length && this.templates.length === 0) {
              this.toast.error({ detail: 'Could not load template details.' });
            }
          }
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.templates = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  duplicateTemplate(template: ITemplateDetails): void {
    this.templateService.duplicate(template.templateId).subscribe({
      next: (response) => {
        if (response && !response.hasError) {
          this.toast.success({ detail: `${template.name} duplicated.` });
          this.loadTemplates();
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not duplicate this template.' });
        }
      },
      error: () => {
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  toggleEnabled(template: ITemplateDetails, event: Event): void {
    if (template.isSystemDefault && template.enabled) {
      return;
    }

    const action = template.enabled ? 'Disable' : 'Enable';
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: template.enabled
        ? `Disable ${template.name}? Doctors currently preferring this template will fall back to the classic default.`
        : `Enable ${template.name}?`,
      header: `${action} Template`,
      acceptButtonStyleClass: template.enabled ? 'p-button-danger' : undefined,
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.templateService.toggleEnabled(template.templateId).subscribe({
          next: (response) => {
            if (response && !response.hasError) {
              this.toast.success({ detail: `${template.name} ${action.toLowerCase()}d.` });
              this.loadTemplates();
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: `Could not ${action.toLowerCase()} this template.` });
            }
          },
          error: () => {
            // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
          },
        });
      },
    });
  }

  deleteTemplate(template: ITemplateDetails, event: Event): void {
    if (template.isSystemDefault) {
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete ${template.name}? Doctors currently preferring this template will fall back to the classic default. This cannot be undone.`,
      header: 'Delete Template',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.templateService.delete(template.templateId).subscribe({
          next: (response) => {
            if (response && !response.hasError) {
              this.toast.success({ detail: `${template.name} deleted.` });
              this.loadTemplates();
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: 'Could not delete this template.' });
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
