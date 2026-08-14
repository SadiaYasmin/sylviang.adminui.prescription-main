import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { IMedicineItem } from '@core/interfaces/prescriptions/prescription.interface';
import { IMedicineSummary } from '@core/interfaces/medicines/medicine.interface';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

const blankMedicine = (): IMedicineItem => ({ medicine: '', generic: null, strength: '', dosage: null, frequency: null, duration: null, instructions: null });

const normalize = (v: string | null | undefined) => (v ?? '').trim().toLowerCase();

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
  @Output() itemsChange = new EventEmitter<IMedicineItem[]>();

  suggestions: IMedicineSummary[] = [];
  activeSuggestionRow: number | null = null;
  duplicateRowIndex: number | null = null;

  private searchTerms = new Subject<string>();

  constructor(private medicineService: MedicineService) {
    this.searchTerms
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => this.medicineService.search(term)),
      )
      .subscribe((res) => (this.suggestions = res.content ?? []));
  }

  ngOnDestroy(): void {
    this.searchTerms.complete();
  }

  addBlank(): void {
    this.itemsChange.emit([...this.items, blankMedicine()]);
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
    const key = `${normalize(changed.medicine)}|${normalize(changed.strength)}`;
    const duplicateIndex = next.findIndex((m, i) => i !== changedIndex && `${normalize(m.medicine)}|${normalize(m.strength)}` === key && key !== '|');

    if (duplicateIndex >= 0) {
      this.duplicateRowIndex = duplicateIndex;
      return;
    }

    this.duplicateRowIndex = null;
    this.itemsChange.emit(next);
  }
}
