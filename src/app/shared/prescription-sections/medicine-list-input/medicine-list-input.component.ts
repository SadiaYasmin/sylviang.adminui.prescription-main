import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { IMedicineItem } from '@core/interfaces/prescriptions/prescription.interface';
import { IMedicineSummary } from '@core/interfaces/medicines/medicine.interface';
import { findExactMedicineDuplicateIndex, findSameNameDifferentStrengthIndex } from '../medicine-duplicate.util';
import { dosagePresetsFor, durationPresetsFor, frequencyPresetsFor, instructionsPresetsFor } from '@core/constants/quick-add-medicine-presets';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

const blankMedicine = (): IMedicineItem => ({ medicine: '', generic: null, strength: '', dosage: null, frequency: null, duration: null, instructions: null });

/**
 * Rx line-item editor (US-022) — a card per medicine, name autocomplete against the
 * Medicine Catalog (Epic F stub), and a client-side duplicate-medicine guard (highlight +
 * block) as a UX nicety on top of the server-side guard that's the real gate.
 */
@Component({
  selector: 'app-medicine-list-input',
  standalone: false,
  templateUrl: './medicine-list-input.component.html',
  styleUrl: './medicine-list-input.component.scss',
})
export class MedicineListInputComponent implements OnDestroy {
  @Input() items: IMedicineItem[] = [];
  @Input() editable = false;
  @Input() emptyReadonlyText = 'No medicines prescribed.';
  @Input() emptyEditableText = 'No medicines added yet.';
  @Input() language: 'en' | 'bn' = 'en';
  // Field labels/placeholders — translated to বাংলা by the caller (via the shared labels
  // dictionary) when the prescription is in বাংলা mode. Medicine name/strength themselves
  // (the doctor-entered *values*, as opposed to these static labels) are never translated.
  @Input() medicinePlaceholder = 'Medicine name';
  @Input() strengthPlaceholder = 'Strength';
  @Input() dosageLabel = 'Dosage';
  @Input() frequencyLabel = 'Frequency';
  @Input() durationLabel = 'Duration';
  @Input() instructionsLabel = 'Instructions';
  @Output() itemsChange = new EventEmitter<IMedicineItem[]>();

  suggestions: IMedicineSummary[] = [];
  activeSuggestionRow: number | null = null;
  duplicateRowIndex: number | null = null;

  /**
   * Follows the document's chosen language — covers Dosage/Frequency/Duration/Instructions
   * across every medicine card. Medicine name and strength are catalog lookups/proper nouns,
   * not free-text phrases, so they're excluded.
   */
  get banglaMode(): boolean {
    return this.language === 'bn';
  }

  /**
   * Non-blocking suggestions for the 4 free-text fields, rendered via native <datalist> —
   * same mechanism the reference prototype uses for these exact fields. A <datalist> only
   * ever *offers* options; it can never restrict what's typed, so this satisfies "always
   * allow a custom value" for free (no JS needed to keep typing unblocked). Recomputed per
   * `language`, so switching English/বাংলা swaps which set of suggestions shows.
   */
  get dosageOptions(): string[] {
    return dosagePresetsFor(this.language);
  }

  get frequencyOptions(): string[] {
    return frequencyPresetsFor(this.language);
  }

  get durationOptions(): string[] {
    return durationPresetsFor(this.language);
  }

  get instructionsOptions(): string[] {
    return instructionsPresetsFor(this.language);
  }

  /**
   * Reactive, not tied to which code path added a row — a Quick Add insertion and a manually
   * typed row are both just entries in `items`, so scanning the current array on every change
   * detection pass catches "same medicine, different strength" regardless of how either row
   * got there. Flags the LATER of the two matching rows. Small arrays (a handful of medicines
   * per prescription), so an O(n²) scan on each check is not a real cost.
   */
  get sameNameDifferentStrengthRowIndex(): number | null {
    for (let i = 0; i < this.items.length; i++) {
      if (findSameNameDifferentStrengthIndex(this.items, this.items[i], i) !== -1 && this.items[i].medicine) {
        // Only flag once the earlier row in the pair has already been passed, so the
        // warning sits under the newer-looking entry rather than the first one typed.
        const priorIndex = this.items.slice(0, i).findIndex((m) => m.medicine && m.medicine.trim().toLowerCase() === this.items[i].medicine.trim().toLowerCase());
        if (priorIndex !== -1) return i;
      }
    }
    return null;
  }

  private searchTerms = new Subject<string>();

  constructor(private medicineService: MedicineService) {
    this.searchTerms
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => this.medicineService.search(term)),
      )
      .subscribe((res) => (this.suggestions = res.content?.medicines ?? []));
  }

  ngOnDestroy(): void {
    this.searchTerms.complete();
  }

  /** Stable per-row identity for *ngFor — rows are only ever appended/removed, never
   *  reordered, so the index is a safe track key. Without this, every keystroke in the
   *  medicine-name field (which updates `items` on every `input` event, not just blur)
   *  replaces the whole array with new object references, and Angular's default identity
   *  diffing tears down and rebuilds every card — including the input the doctor is
   *  actively typing into — losing focus after every single character. */
  trackByIndex(index: number): number {
    return index;
  }

  addBlank(): void {
    // A freshly added row must never inherit whatever suggestion state the previous row
    // left behind — otherwise clicking "+" can appear to pop the dropdown open on an
    // empty field, showing unrelated leftover results from the last search.
    this.activeSuggestionRow = null;
    this.suggestions = [];
    this.itemsChange.emit([...this.items, blankMedicine()]);
  }

  medDetails(m: IMedicineItem): string {
    return [m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ');
  }

  remove(index: number): void {
    const next = this.items.slice();
    next.splice(index, 1);
    this.itemsChange.emit(next);
    this.duplicateRowIndex = null;
  }

  onFieldChange(index: number, field: keyof IMedicineItem, raw: string): void {
    const next = this.items.map((m, i) => (i === index ? { ...m, [field]: raw } : m));
    this.applyIfNoDuplicate(next, index);
    if (field === 'medicine') {
      this.activeSuggestionRow = index;
      this.searchTerms.next(raw);
    }
  }

  /** Suggestions are a single list shared by every row (only one row is ever "active" at a
   *  time), so switching which row is focused must clear out whatever the previous row's
   *  search returned — otherwise a newly focused/empty row can briefly show a completely
   *  unrelated row's leftover results. Re-runs the search for this row's own current text
   *  (if any), so tabbing back into a row that already has a value shows relevant options
   *  again instead of nothing. */
  onMedicineFocus(index: number, value: string): void {
    this.activeSuggestionRow = index;
    this.suggestions = [];
    if (value) this.searchTerms.next(value);
  }

  /** Deferred so a suggestion's (mousedown) still fires before blur closes the list — closes
   *  it on every other case too: clicking elsewhere on the page, or tabbing to another field. */
  onMedicineBlur(): void {
    setTimeout(() => (this.activeSuggestionRow = null), 150);
  }

  selectSuggestion(index: number, suggestion: IMedicineSummary): void {
    const next = this.items.map((m, i) =>
      i === index ? { ...m, medicine: suggestion.brandName, generic: suggestion.genericName, strength: suggestion.strength ?? m.strength } : m,
    );
    this.applyIfNoDuplicate(next, index);
    this.activeSuggestionRow = null;
    this.suggestions = [];
  }

  private applyIfNoDuplicate(next: IMedicineItem[], changedIndex: number): void {
    const changed = next[changedIndex];
    const duplicateIndex = findExactMedicineDuplicateIndex(next, changed, changedIndex);

    if (duplicateIndex >= 0) {
      this.duplicateRowIndex = duplicateIndex;
      return;
    }

    this.duplicateRowIndex = null;
    this.itemsChange.emit(next);
  }
}
