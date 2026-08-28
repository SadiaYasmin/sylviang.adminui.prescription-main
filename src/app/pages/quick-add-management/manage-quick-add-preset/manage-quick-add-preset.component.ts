import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { findQuickAddSectionByRoute, IQuickAddSectionOption } from '@core/constants/quick-add-section-options';
import { CUSTOM_INSTRUCTIONS_VALUE, DOSAGE_PRESETS, DURATION_PRESETS, FREQUENCY_PRESETS, INSTRUCTIONS_PRESETS } from '@core/constants/quick-add-medicine-presets';
import { ADVICE_SUGGESTIONS, DIAGNOSIS_SUGGESTIONS, FOLLOW_UP_SUGGESTIONS, INVESTIGATION_SUGGESTIONS } from '@core/constants/quick-add-suggestions';
import { derivePresetLabel, IAdvicePhraseDictionary, resolveKnownPhraseTranslation } from '@core/interfaces/quick-add/quick-add.interface';
import { IMedicineSummary } from '@core/interfaces/medicines/medicine.interface';
import { ToastService } from '@core/services/misc/toast.service';
import { QuickAddService } from '@core/services/quick-add/quick-add.service';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
export class ManageQuickAddPresetComponent implements OnInit, OnDestroy {
  constructor(
    private fb: FormBuilder,
    private quickAddService: QuickAddService,
    private medicineService: MedicineService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {
    this.searchTerms
      .pipe(debounceTime(250), distinctUntilChanged(), switchMap((term) => this.medicineService.search(term)))
      .subscribe((res) => (this.medicineSuggestions = res.content?.medicines ?? []));
  }

  section!: IQuickAddSectionOption;
  form!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  presetId!: number;
  loading = false;
  saving = false;

  phraseDictionary: IAdvicePhraseDictionary = {};
  banglaManuallyEdited = false;

  // ===== Medicine name autocomplete (mirrors medicine-list-input.component.ts) =====
  medicineSuggestions: IMedicineSummary[] = [];
  showMedicineSuggestions = false;
  private readonly searchTerms = new Subject<string>();

  // ===== Predefined dropdowns for Dosage/Frequency/Duration/Instructions =====
  readonly dosagePresets = DOSAGE_PRESETS;
  readonly frequencyPresets = FREQUENCY_PRESETS;
  readonly durationPresets = DURATION_PRESETS;
  readonly instructionsPresets = INSTRUCTIONS_PRESETS;
  readonly customInstructionsValue = CUSTOM_INSTRUCTIONS_VALUE;
  /** Instructions starts as a preset dropdown; switches to free text via "Custom…" or when
   *  loading an existing preset whose stored instructions text isn't one of the presets. */
  customInstructions = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.section = findQuickAddSectionByRoute(params.get('section')!);
      this.initForm();

      if (this.section.payloadShape === 'bilingual') {
        this.quickAddService.getAdvicePhraseDictionary().subscribe((res) => {
          if (!res.hasError && res.content) this.phraseDictionary = res.content;
          // Covers the race where this dictionary finishes loading AFTER loadPreset() has
          // already patched the form — its own post-load check (below) only catches a
          // known phrase if the dictionary was already here by then.
          if (this.isEditMode) this.applyKnownTranslation();
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

  ngOnDestroy(): void {
    this.searchTerms.complete();
  }

  // ===== Medicine name autocomplete =====
  // These bypass `formControlName`'s own DOM value accessor (need the raw keystroke for the
  // debounced search, and a direct patch on suggestion select), so `setValue`/`patchValue`
  // here never trigger Angular's normal dirty-tracking pipeline — mark dirty explicitly, or
  // the edit-mode "Save disabled until something changes" button never enables.
  onMedicineInput(value: string): void {
    const control = this.form.get('medicine');
    control?.setValue(value);
    control?.markAsDirty();
    this.showMedicineSuggestions = true;
    this.searchTerms.next(value);
  }

  selectMedicineSuggestion(suggestion: IMedicineSummary): void {
    this.form.patchValue({
      medicine: suggestion.brandName,
      strength: suggestion.strength || this.form.get('strength')?.value,
    });
    this.form.markAsDirty();
    this.showMedicineSuggestions = false;
    this.medicineSuggestions = [];
  }

  hideMedicineSuggestions(): void {
    // Deferred so a suggestion's (mousedown) still fires before the input's blur hides the list.
    setTimeout(() => (this.showMedicineSuggestions = false), 150);
  }

  // ===== Instructions preset/custom toggle =====
  // Same reasoning as the medicine handlers above: this select isn't `formControlName`-bound
  // (it shows a different value than the control in "custom" mode), so mark dirty by hand.
  onInstructionsPresetChange(value: string): void {
    const control = this.form.get('instructions');
    if (value === CUSTOM_INSTRUCTIONS_VALUE) {
      this.customInstructions = true;
      control?.setValue('');
    } else {
      control?.setValue(value);
    }
    control?.markAsDirty();
  }

  useInstructionsPreset(): void {
    this.customInstructions = false;
    const control = this.form.get('instructions');
    control?.setValue('');
    control?.markAsDirty();
  }

  // ===== Dosage/Frequency/Duration option lists, with a legacy stored value (typed
  // before these were dropdowns, or not matching any preset) prepended so it stays
  // visible/selected instead of silently dropping off the list. =====
  private withLegacyValue(presets: string[], value: string | null | undefined): string[] {
    return value && !presets.includes(value) ? [value, ...presets] : presets;
  }

  // ===== Autocomplete suggestion lists (native <datalist>) for the non-medicine sections.
  // Suggestions only — the doctor can always type a custom value; nothing is forced. Advice/
  // Follow-Up expose per-language lists so each bilingual field suggests in its own language.
  get textSuggestions(): string[] {
    if (this.section.payloadShape === 'diagnosis') return DIAGNOSIS_SUGGESTIONS;
    if (this.section.sectionType === 'Investigation') return INVESTIGATION_SUGGESTIONS;
    return [];
  }

  get englishSuggestions(): string[] {
    return this.section.sectionType === 'FollowUp' ? FOLLOW_UP_SUGGESTIONS.en : ADVICE_SUGGESTIONS.en;
  }

  get banglaSuggestions(): string[] {
    return this.section.sectionType === 'FollowUp' ? FOLLOW_UP_SUGGESTIONS.bn : ADVICE_SUGGESTIONS.bn;
  }

  get dosageOptions(): string[] {
    return this.withLegacyValue(this.dosagePresets, this.form?.get('dosage')?.value);
  }

  get frequencyOptions(): string[] {
    return this.withLegacyValue(this.frequencyPresets, this.form?.get('frequency')?.value);
  }

  get durationOptions(): string[] {
    return this.withLegacyValue(this.durationPresets, this.form?.get('duration')?.value);
  }

  private initForm(): void {
    // No separate "Label" control — the content fields below are the preset's identity,
    // matching the reference prototype (no label field there at all). `buildPayload`
    // derives a label from these same fields right before submit.
    switch (this.section.payloadShape) {
      case 'medicine':
        this.form = this.fb.group({
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
          text: [null, Validators.required],
          icd10: [null],
        });
        break;
      case 'bilingual':
        this.form = this.fb.group({
          en: [null, Validators.required],
          bn: [null],
        });
        break;
      case 'text':
      default:
        this.form = this.fb.group({
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
            let payload = JSON.parse(preset.payloadJson);
            // Older seeded 'text'-shape rows stored the payload as a bare JSON string (e.g.
            // "CBC") instead of { text: "CBC" } — normalize so patchValue() targets the
            // actual 'text' control instead of silently no-op'ing on a raw string.
            if (this.section.payloadShape === 'text' && typeof payload === 'string') {
              payload = { text: payload };
            }
            this.form.patchValue(payload);
            // A pre-existing preset's instructions text might not be one of the predefined
            // options (typed before this dropdown existed, or picked "Custom" originally) —
            // show it in the free-text field rather than silently blanking the selection.
            if (this.section.payloadShape === 'medicine' && payload.instructions && !INSTRUCTIONS_PRESETS.includes(payload.instructions)) {
              this.customInstructions = true;
            }
            // patchValue() never fires the native input event onEnglishInput() listens for,
            // so an existing Advice/FollowUp preset saved with বাংলা left blank (or saved
            // before a phrase became recognized) would otherwise sit empty forever, even
            // when the English text is one the dictionary/pattern can translate right now.
            if (this.section.payloadShape === 'bilingual') this.applyKnownTranslation();
          } catch {
            // Malformed stored payload — leave the form at its blank defaults rather than crash.
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
    this.applyKnownTranslation();
  }

  /**
   * Looks up (exact dictionary match, then the day-count pattern) and applies a Bangla
   * translation for whatever's currently in the English field. Called both on every
   * keystroke (`onEnglishInput`) and once right after an existing preset loads
   * (`loadPreset`) — patching the form programmatically on load never fires the input
   * event `onEnglishInput` listens for, so without this second call an existing preset
   * that was saved before this dictionary/pattern existed (or before Bangla was filled
   * in) would sit there showing an empty বাংলা field forever, even on a phrase the
   * dictionary now recognizes.
   */
  private applyKnownTranslation(): void {
    const translation = resolveKnownPhraseTranslation(this.form.get('en')?.value, this.phraseDictionary);
    if (!translation) return;

    const bnControl = this.form.get('bn');
    const currentBn = (bnControl?.value || '').trim();

    if (!currentBn || !this.banglaManuallyEdited) {
      if (bnControl?.value === translation) return; // already applied — avoid a no-op dirty flag
      bnControl?.setValue(translation);
      // Needed for the load-triggered call: setValue() alone doesn't mark the control
      // dirty, and an auto-filled বাংলা the doctor never typed is still a real change
      // worth letting them save (edit-mode Save stays disabled otherwise).
      bnControl?.markAsDirty();
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

  private buildPayload(): Record<string, unknown> {
    return this.form.getRawValue();
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    const label = derivePresetLabel(this.section.payloadShape, payload);
    const payloadJson = JSON.stringify(payload);

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
