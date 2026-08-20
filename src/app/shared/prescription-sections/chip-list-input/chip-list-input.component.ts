import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Freeform multi-line editor for list-style clinical fields (Chief Complaint / History /
 * Investigations / Advice) — one line per item, no chip/add-button UI, matching the
 * reference prototype's paper-pad textarea. Local text is the source of truth while typing;
 * the parent only hears about clean, trimmed lines, and only once the field is committed
 * (blur) — otherwise a blank line the user just typed would be wiped out from under them by
 * the filtered value coming back down as an input.
 */
@Component({
  selector: 'app-chip-list-input',
  standalone: false,
  templateUrl: './chip-list-input.component.html',
  styleUrl: './chip-list-input.component.scss',
})
export class ChipListInputComponent {
  @Input() items: string[] = [];
  @Input() editable = false;
  @Input() placeholder = 'Add and press Enter...';
  @Input() emptyReadonlyText = 'None recorded.';
  @Input() language: 'en' | 'bn' = 'en';
  /**
   * Opt-in, default off — mirrors the reference prototype's `ChipListInput avroEnabled`
   * prop, which only Chief Complaint and Advice pass. History and Investigations reuse
   * this same component but must stay plain English input, so they don't set this.
   */
  @Input() avroEnabled = false;
  @Output() itemsChange = new EventEmitter<string[]>();

  get banglaMode(): boolean {
    return this.avroEnabled && this.language === 'bn';
  }

  private draft = '';
  private focused = false;

  get rows(): number {
    return Math.max(2, this.items.length + 1);
  }

  get textValue(): string {
    if (!this.focused) {
      this.draft = this.items.join('\n');
    }
    return this.draft;
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(value: string): void {
    this.focused = false;
    this.draft = value;
    const lines = value
      .split('\n')
      .map((l) => l.replace(/^[-•]\s*/, '').trim())
      .filter((l) => l.length > 0);
    this.itemsChange.emit(lines);
  }
}
