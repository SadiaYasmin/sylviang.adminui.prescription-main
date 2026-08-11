import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { LABEL_GROUPS, defaultLabelsForLanguage } from '@core/constants/prescription-labels';
import { IHospitalSettings } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { ITemplateConfig, ITemplateDetails, TemplateLanguage } from '@core/interfaces/templates/template.interface';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { TemplateService } from '@core/services/templates/template.service';
import { ToastService } from '@core/services/misc/toast.service';
import {
  BorderStyleOptions,
  FontFamilyOptions,
  NameFontOptions,
  OrientationOptions,
  TableStyleOptions,
  TabDefinitions,
  TemplateLanguageOptions,
  TemplateTypeOptions,
} from './manage-template.component.constants';

/**
 * Converts the backend's PascalCase template language ('En'/'Bn') into the lowercase
 * form the label-defaults helpers (`defaultLabelsForLanguage`, `LABEL_GROUPS` consumers)
 * use, since those are shared with other parts of the bilingual-support feature set.
 */
export function toLangCode(language: TemplateLanguage): 'en' | 'bn' {
  return language === 'Bn' ? 'bn' : 'en';
}

function canonicalJson(labels: Record<string, string>): string {
  const sortedKeys = Object.keys(labels || {}).sort();
  const canonical: Record<string, string> = {};
  for (const key of sortedKeys) {
    canonical[key] = labels[key];
  }
  return JSON.stringify(canonical);
}

/**
 * Pure, unit-testable comparison used by the Language tab's reset-vs-preserve logic
 * (US-049): a template's labels are considered "still on language defaults" only if
 * every key/value in `labels` deep-equals the given language's default set — anything
 * else (an admin customization, a missing/extra key) counts as drifted.
 */
export function labelsMatchLanguageDefaults(labels: Record<string, string> | null | undefined, language: 'en' | 'bn'): boolean {
  return canonicalJson(labels || {}) === canonicalJson(defaultLabelsForLanguage(language));
}

@Component({
  selector: 'app-manage-template',
  standalone: false,
  templateUrl: './manage-template.component.html',
  styleUrl: './manage-template.component.scss',
})
export class ManageTemplateComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private templateService: TemplateService,
    private hospitalSettingsService: HospitalSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
  ) {}

  isEditMode = false;
  templateId!: number;
  loading = false;
  saving = false;

  template: ITemplateDetails | null = null;
  configForm!: FormGroup;
  createForm!: FormGroup;

  hospitalSettings: IHospitalSettings | null = null;

  activeTab = 'header';

  labelGroups = LABEL_GROUPS;
  typeOptions = TemplateTypeOptions;
  languageOptions = TemplateLanguageOptions;
  borderStyleOptions = BorderStyleOptions;
  nameFontOptions = NameFontOptions;
  fontFamilyOptions = FontFamilyOptions;
  tableStyleOptions = TableStyleOptions;
  orientationOptions = OrientationOptions;
  tabs = TabDefinitions;

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(200)]],
      type: ['Classic', Validators.required],
      language: ['En', Validators.required],
    });

    this.hospitalSettingsService.get().subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.hospitalSettings = response.content;
        }
      },
      error: () => {
        // Preview simply renders without hospital branding if this fails.
      },
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.templateId = +idParam;
        this.isEditMode = true;
        this.loadTemplate();
      }
    });

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Prescription Templates', icon: 'fa-solid fa-file-medical', href: '/templates/template-list' },
      { title: this.isEditMode ? 'Edit Template' : 'Create Template', icon: 'fa-solid fa-edit', href: '/templates/manage-template' },
    ]);
  }

  private loadTemplate(): void {
    this.loading = true;
    this.templateService.getById(this.templateId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && !response.hasError && response.content) {
          this.template = response.content;
          this.configForm = this.buildConfigForm(this.template);
        } else {
          this.toast.error({ detail: 'Could not load this template.' });
          this.router.navigate(['/templates/template-list']);
        }
      },
      error: () => {
        this.loading = false;
        this.toast.error({ detail: 'Could not load this template.' });
        this.router.navigate(['/templates/template-list']);
      },
    });
  }

  private buildConfigForm(template: ITemplateDetails): FormGroup {
    const config = template.config;
    return this.fb.group({
      name: [template.name, [Validators.required, Validators.maxLength(200)]],
      header: this.fb.group({
        bgColor: [config.header.bgColor],
        height: [config.header.height, [Validators.required, Validators.min(0)]],
        logoSize: [config.header.logoSize, [Validators.required, Validators.min(0)]],
        nameFont: [config.header.nameFont, Validators.required],
        borderStyle: [config.header.borderStyle, Validators.required],
      }),
      footer: this.fb.group({
        bgColor: [config.footer.bgColor],
        height: [config.footer.height, [Validators.required, Validators.min(0)]],
        qrMessage: [config.footer.qrMessage],
        qrMessageBn: [config.footer.qrMessageBn],
        borderStyle: [config.footer.borderStyle, Validators.required],
      }),
      style: this.fb.group({
        sectionSpacing: [config.style.sectionSpacing, [Validators.required, Validators.min(0)]],
        borderRadius: [config.style.borderRadius, [Validators.required, Validators.min(0)]],
        borderStyle: [config.style.borderStyle, Validators.required],
        accentColor: [config.style.accentColor],
        fontFamily: [config.style.fontFamily, Validators.required],
        fontSize: [config.style.fontSize, [Validators.required, Validators.min(8)]],
        tableStyle: [config.style.tableStyle, Validators.required],
        watermarkText: [config.style.watermarkText],
      }),
      visibility: this.fb.group({
        logo: [config.visibility.logo],
        slogan: [config.visibility.slogan],
        footer: [config.visibility.footer],
        watermark: [config.visibility.watermark],
      }),
      print: this.fb.group({
        pageSize: [config.print.pageSize || 'A4', Validators.required],
        orientation: [config.print.orientation, Validators.required],
        marginMm: [config.print.marginMm, [Validators.required, Validators.min(0)]],
      }),
      labels: this.buildLabelsGroup(config.labels),
    });
  }

  private buildLabelsGroup(labels: Record<string, string>): FormGroup {
    const controls: Record<string, unknown> = {};
    for (const group of this.labelGroups) {
      for (const item of group.keys) {
        controls[item.key] = [labels?.[item.key] ?? ''];
      }
    }
    return this.fb.group(controls);
  }

  get labelsGroup(): FormGroup {
    return this.configForm.get('labels') as FormGroup;
  }

  get isGovernment(): boolean {
    return this.template?.type === 'Government';
  }

  get currentLangCode(): 'en' | 'bn' {
    return this.template ? toLangCode(this.template.language) : 'en';
  }

  get labelsDrifted(): boolean {
    if (!this.configForm) return false;
    return !labelsMatchLanguageDefaults(this.labelsGroup.getRawValue(), this.currentLangCode);
  }

  get previewConfig(): ITemplateConfig | null {
    if (!this.configForm) return null;
    const raw = this.configForm.getRawValue();
    return {
      header: raw.header,
      footer: raw.footer,
      style: raw.style,
      visibility: raw.visibility,
      print: raw.print,
      labels: raw.labels,
    };
  }

  resetLabelsToDefaults(): void {
    if (!this.template) return;
    this.labelsGroup.patchValue(defaultLabelsForLanguage(this.currentLangCode));
    this.labelsGroup.markAsDirty();
  }

  changeLanguage(newLanguage: TemplateLanguage): void {
    if (!this.template || newLanguage === this.template.language) return;

    const oldLangCode = toLangCode(this.template.language);
    const currentLabels = this.labelsGroup.getRawValue();

    // Only auto-swap labels if the admin never customized them away from the OLD
    // language's defaults — an intentional customization is always preserved (US-049).
    if (labelsMatchLanguageDefaults(currentLabels, oldLangCode)) {
      const newDefaults = defaultLabelsForLanguage(toLangCode(newLanguage));
      this.labelsGroup.patchValue(newDefaults);
    }

    this.template = { ...this.template, language: newLanguage };
    this.configForm.markAsDirty();
  }

  clearColor(groupName: 'header' | 'footer' | 'style', controlName: string): void {
    (this.configForm.get(groupName) as FormGroup).get(controlName)?.setValue(null);
    (this.configForm.get(groupName) as FormGroup).get(controlName)?.markAsDirty();
  }

  save(): void {
    if (!this.isEditMode || !this.template) return;

    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const raw = this.configForm.getRawValue();
    const config: ITemplateConfig = {
      header: raw.header,
      footer: raw.footer,
      style: raw.style,
      visibility: raw.visibility,
      print: raw.print,
      labels: raw.labels,
    };

    this.templateService.update(this.templateId, { name: raw.name, config, language: this.template.language }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response && !response.hasError) {
          this.toast.success({ detail: 'Template updated successfully.' });
          this.configForm.markAsPristine();
          this.router.navigate(['/templates/template-list']);
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not update this template.' });
        }
      },
      error: () => {
        this.saving = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  createTemplate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const value = this.createForm.value;
    this.templateService.create({ name: value.name, type: value.type, language: value.language }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response && !response.hasError && response.content) {
          this.toast.success({ detail: 'Template created. You can now customize it.' });
          this.router.navigate(['/templates/manage-template', response.content.templateId]);
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not create this template.' });
        }
      },
      error: () => {
        this.saving = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  goBack(): void {
    const dirty = this.isEditMode ? this.configForm?.dirty : this.createForm?.dirty;
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) {
      return;
    }
    this.router.navigate(['/templates/template-list']);
  }
}
