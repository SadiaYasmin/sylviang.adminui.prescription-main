import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IDiagnosisItem } from '@core/interfaces/prescriptions/prescription.interface';

/**
 * One multiline textarea, parsed to {text, icd10}[] on blur (US-021) — mirrors the
 * reference prototype's line-prefix/trailing-parenthesis authoring convention: each line
 * becomes one diagnosis, a leading "- "/"•" is stripped, a trailing "(...)" becomes icd10.
 */
@Component({
  selector: 'app-diagnosis-list-input',
  standalone: false,
  templateUrl: './diagnosis-list-input.component.html',
  styleUrl: './diagnosis-list-input.component.scss',
})
export class DiagnosisListInputComponent {
  @Input() items: IDiagnosisItem[] = [];
  @Input() editable = false;
  @Input() emptyReadonlyText = 'No diagnosis recorded.';
  // Diagnosis text is always plain English (ICD-10-style entries, not free-form
  // clinical phrasing) — never gets Avro phonetic Bangla input, regardless of the
  // document's selected language. `language` is still accepted since callers pass
  // it uniformly across all section inputs, but it's intentionally unused here.
  @Input() language: 'en' | 'bn' = 'en';
  @Output() itemsChange = new EventEmitter<IDiagnosisItem[]>();

  private draft = '';
  private focused = false;

  get rows(): number {
    return Math.max(2, this.items.length + 1);
  }

  get textValue(): string {
    if (!this.focused) {
      this.draft = this.toText(this.items);
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

    const items: IDiagnosisItem[] = lines.map((line) => {
      const match = line.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      if (match) {
        return { text: match[1].trim(), icd10: match[2].trim() };
      }
      return { text: line, icd10: null };
    });

    this.itemsChange.emit(items);
  }

  private toText(items: IDiagnosisItem[]): string {
    return items.map((d) => (d.icd10 ? `${d.text} (${d.icd10})` : d.text)).join('\n');
  }
}
