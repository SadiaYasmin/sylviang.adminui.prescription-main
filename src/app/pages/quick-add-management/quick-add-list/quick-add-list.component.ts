import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { findQuickAddSectionByRoute, IQuickAddSectionOption, QUICK_ADD_SECTION_OPTIONS } from '@core/constants/quick-add-section-options';
import { IQuickAddPreset } from '@core/interfaces/quick-add/quick-add.interface';
import { QuickAddService } from '@core/services/quick-add/quick-add.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';

/** US-041-044: one generic list component shared by all 5 Quick Add section types. */
@Component({
  selector: 'app-quick-add-list',
  standalone: false,
  templateUrl: './quick-add-list.component.html',
  styleUrl: './quick-add-list.component.scss',
})
export class QuickAddListComponent implements OnInit {
  constructor(
    private quickAddService: QuickAddService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  section!: IQuickAddSectionOption;
  sections = QUICK_ADD_SECTION_OPTIONS;
  presets: IQuickAddPreset[] = [];
  loading = false;
  searchTerm = '';

  /** Instant client-side filter — these lists are small and already fully loaded, so a
   *  server round trip per keystroke isn't warranted (unlike the paginated Medicine Catalog). */
  get filteredPresets(): IQuickAddPreset[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.presets;
    return this.presets.filter((p) => this.previewPayload(p).toLowerCase().includes(term));
  }

  get skeletonItems() {
    return Array(3)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.section = findQuickAddSectionByRoute(params.get('section')!);
      this.searchTerm = '';
      this.loadPresets();
    });
  }

  loadPresets(): void {
    this.loading = true;
    this.quickAddService.getList(this.section.sectionType).subscribe({
      next: (response) => {
        this.presets = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.presets = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  previewPayload(preset: IQuickAddPreset): string {
    try {
      const payload = JSON.parse(preset.payloadJson);
      switch (this.section.payloadShape) {
        case 'medicine':
          return [payload.medicine, payload.strength, payload.dosage, payload.frequency, payload.duration, payload.instructions].filter(Boolean).join(' · ');
        case 'diagnosis':
          return payload.icd10 ? `${payload.text} (${payload.icd10})` : payload.text;
        case 'bilingual':
          return payload.bn ? `${payload.en} / ${payload.bn}` : payload.en;
        case 'text':
        default:
          return payload.text;
      }
    } catch {
      return preset.payloadJson;
    }
  }

  deletePreset(preset: IQuickAddPreset, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "${preset.label}"?`,
      header: 'Delete Preset',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.quickAddService.delete(preset.quickAddPresetId).subscribe({
          next: (response) => {
            if (response && !response.hasError) {
              this.toast.success({ detail: `"${preset.label}" deleted.` });
              this.loadPresets();
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: 'Could not delete this preset.' });
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
