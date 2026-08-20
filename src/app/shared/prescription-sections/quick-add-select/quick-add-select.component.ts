import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { QuickAddService } from '@core/services/quick-add/quick-add.service';
import { IQuickAddPreset, QuickAddSectionType, resolveQuickAddOptionLabel } from '@core/interfaces/quick-add/quick-add.interface';

/**
 * "Quick Add [X]" one-click insert dropdown (US-025, Epic G stub) — insert-only, no
 * management UI here (that's full Epic G's job). Emits the preset's already-parsed
 * payload; callers decide how to merge it into their section's list.
 */
@Component({
  selector: 'app-quick-add-select',
  standalone: false,
  templateUrl: './quick-add-select.component.html',
  styleUrl: './quick-add-select.component.scss',
})
export class QuickAddSelectComponent implements OnChanges {
  @Input() sectionType!: QuickAddSectionType;
  @Input() label = 'Quick Add';
  /** Only affects Advice/FollowUp option text (bilingual presets) — see resolveQuickAddOptionLabel. */
  @Input() language: 'en' | 'bn' = 'en';
  @Output() insert = new EventEmitter<unknown>();

  presets: IQuickAddPreset[] = [];
  open = false;

  constructor(private quickAddService: QuickAddService) {}

  ngOnChanges(): void {
    if (this.sectionType) {
      this.quickAddService.getList(this.sectionType).subscribe((res) => (this.presets = res.content ?? []));
    }
  }

  toggle(): void {
    this.open = !this.open;
  }

  optionLabel(preset: IQuickAddPreset): string {
    return resolveQuickAddOptionLabel(preset, this.language);
  }

  choose(preset: IQuickAddPreset): void {
    try {
      this.insert.emit(JSON.parse(preset.payloadJson));
    } catch {
      this.insert.emit(preset.label);
    }
    this.open = false;
  }
}
