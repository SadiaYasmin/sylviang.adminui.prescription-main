import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { findQuickAddSectionByRoute, IQuickAddSectionOption } from '@core/constants/quick-add-section-options';
import { IAdvicePhraseDictionary } from '@core/interfaces/quick-add/quick-add.interface';
import { ToastService } from '@core/services/misc/toast.service';
import { QuickAddService } from '@core/services/quick-add/quick-add.service';
import { ConfirmationService } from 'primeng/api';

/**
 * US-041-043: one generic create/edit form shared by all 5 Quick Add section types, with
 * per-`payloadShape` field groups. Advice/FollowUp additionally get auto-translate
 * (US-043): typing/editing the English field looks up a known-phrase dictionary and fills
 * Bangla, but only into an empty/untouched Bangla field, and always confirms before
 * overwriting a manually-entered one.
 */
@Component({
  selector: 'app-manage-quick-add-preset',
  standalone: false,
  templateUrl: './manage-quick-add-preset.component.html',
  styleUrl: './manage-quick-add-preset.component.scss',
})
export class ManageQuickAddPresetComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private quickAddService: QuickAddService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  section!: IQuickAddSectionOption;
  form!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  presetId!: number;
  loading = false;
  saving = false;

  phraseDictionary: IAdvicePhraseDictionary = {};
  banglaManuallyEdited = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.section = findQuickAddSectionByRoute(params.get('section')!);
      this.initForm();

      if (this.section.payloadShape === 'bilingual') {
        this.quickAddService.getAdvicePhraseDictionary().subscribe((res) => {
          if (!res.hasError && res.content) this.phraseDictionary = res.content;
        });
      }

      const idParam = params.get('id');
      if (idParam) {
        this.presetId = +idParam;
        this.isEditMode = true;
        this.loadPreset();
      }

      this.breadcrumbService.setBreadcrumbs([
        { title: this.section.label, icon: this.section.icon, href: `/quick-add/${this.section.routeSegment}` },
        { title: this.isEditMode ? 'Edit Preset' : 'Add Preset', icon: 'fa-solid fa-edit', href: `/quick-add/${this.section.routeSegment}/manage` },
      ]);
    });
  }

  private initForm(): void {
    switch (this.section.payloadShape) {
      case 'medicine':
        this.form = this.fb.group({
          label: [null, [Validators.required, Validators.maxLength(300)]],
          medicine: [null, Validators.required],
          strength: [null],
          dosage: [null],
          frequency: [null],
          duration: [null],
          instructions: [null],
        });
        break;
      case 'diagnosis':
        this.form = this.fb.group({
          label: [null, [Validators.required, Validators.maxLength(300)]],
          text: [null, Validators.required],
          icd10: [null],
        });
        break;
      case 'bilingual':
        this.form = this.fb.group({
          label: [null, [Validators.required, Validators.maxLength(300)]],
          en: [null, Validators.required],
          bn: [null],
        });
        break;
      case 'text':
      default:
        this.form = this.fb.group({
          label: [null, [Validators.required, Validators.maxLength(300)]],
          text: [null, Validators.required],
        });
        break;
    }
  }

  private loadPreset(): void {
    this.loading = true;
    this.quickAddService.getList(this.section.sectionType).subscribe({
      next: (response) => {
        const preset = response.content?.find((p) => p.quickAddPresetId === this.presetId);
        if (preset) {
          try {
            const payload = JSON.parse(preset.payloadJson);
            this.form.patchValue({ label: preset.label, ...payload });
          } catch {
            this.form.patchValue({ label: preset.label });
          }
        } else {
          this.toast.error({ detail: 'Could not load this preset.' });
          this.goBack();
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error({ detail: 'Could not load this preset.' });
        this.loading = false;
        this.goBack();
      },
    });
  }

  get f() {
    return this.form.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  onBanglaInput(): void {
    this.banglaManuallyEdited = true;
  }

  onEnglishInput(): void {
    const en = (this.form.get('en')?.value || '').trim().toLowerCase();
    const translation = this.phraseDictionary[en];
    if (!translation) return;

    const bnControl = this.form.get('bn');
    const currentBn = (bnControl?.value || '').trim();

    if (!currentBn || !this.banglaManuallyEdited) {
      bnControl?.setValue(translation);
      this.banglaManuallyEdited = false;
      return;
    }

    // A manually-entered Bangla translation is never silently overwritten (US-043).
    this.confirmationService.confirm({
      message: 'Replace your Bangla text with the known translation for this phrase?',
      header: 'Overwrite Bangla Text',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        bnControl?.setValue(translation);
        this.banglaManuallyEdited = false;
      },
    });
  }

  private buildPayload(): unknown {
    const value = this.form.getRawValue();
    const { label, ...payload } = value;
    return payload;
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const label = this.form.get('label')!.value;
    const payloadJson = JSON.stringify(this.buildPayload());

    const action$ = this.isEditMode
      ? this.quickAddService.update(this.presetId, { label, payloadJson })
      : this.quickAddService.add({ sectionType: this.section.sectionType, label, payloadJson });

    action$.subscribe({
      next: (response) => {
        this.saving = false;
        if (response && !response.hasError) {
          this.toast.success({ detail: `Preset ${this.isEditMode ? 'updated' : 'created'} successfully.` });
          this.goBack();
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: `Could not ${this.isEditMode ? 'update' : 'create'} this preset.` });
        }
      },
      error: () => {
        this.saving = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/quick-add', this.section.routeSegment]);
  }
}
