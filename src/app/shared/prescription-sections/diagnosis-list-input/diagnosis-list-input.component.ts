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
  @Output() itemsChange = new EventEmitter<IDiagnosisItem[]>();

  draft = '';
  private draftInitialized = false;

  /** US-070: opt-in per field — off by default so doctors can type plain English notes. */
  banglaMode = false;

  private ensureDraft(): void {
    if (!this.draftInitialized) {
      this.draft = this.toText(this.items);
      this.draftInitialized = true;
    }
  }

  get textValue(): string {
    this.ensureDraft();
    return this.draft;
  }

  onBlur(value: string): void {
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
