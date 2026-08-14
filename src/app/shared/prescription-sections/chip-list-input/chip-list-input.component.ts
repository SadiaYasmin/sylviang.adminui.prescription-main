import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Add/remove string-list editor for Chief Complaints / History / Investigations / Advice
 * (US-021/023) — shared across all three template layouts (classic/corporate/government)
 * so the chip-add UX and read-only rendering live in exactly one place.
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
  @Output() itemsChange = new EventEmitter<string[]>();

  draft = '';

  add(): void {
    const value = this.draft.trim();
    if (!value) return;
    this.itemsChange.emit([...this.items, value]);
    this.draft = '';
  }

  remove(index: number): void {
    const next = this.items.slice();
    next.splice(index, 1);
    this.itemsChange.emit(next);
  }
}
