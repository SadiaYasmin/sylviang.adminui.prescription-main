import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IExamination } from '@core/interfaces/prescriptions/prescription.interface';
import { toBanglaDigits, toAsciiDigits } from '@app/shared/utils/bangla-digits.util';

interface VitalField {
  key: keyof IExamination;
  label: string;
}

/** Examination/vitals grid (US-021) — all free-text fields, matching the reference prototype. */
@Component({
  selector: 'app-vitals-input',
  standalone: false,
  templateUrl: './vitals-input.component.html',
  styleUrl: './vitals-input.component.scss',
})
export class VitalsInputComponent {
  @Input() value: IExamination = {
    bp: null,
    pulse: null,
    temperature: null,
    respiratoryRate: null,
    spo2: null,
    weight: null,
    height: null,
    bloodSugar: null,
    painScore: null,
    heartRate: null,
  };
  @Input() editable = false;
  @Input() vitalLabels: string[] = ['BP', 'Pulse', 'Temp (°F)', 'RR', 'SpO2', 'Weight (kg)', 'Height (cm)', 'Blood Sugar', 'Pain Score', 'Heart Rate'];
  /** BMI is computed, not stored — its label isn't part of the positional `vitalLabels`
   *  array the other 10 fields share, so it gets its own input. */
  @Input() bmiLabel = 'BMI';
  /**
   * US-067: when 'bn', vitals *display* Bangla numerals (রক্তচাপ ১২০/৮০) while the value
   * emitted/stored stays plain ASCII, since BMI and other numeric parsing can't read Bangla
   * numerals. Digit substitution is 1:1 length-preserving so the caret position survives.
   */
  @Input() language: 'en' | 'bn' = 'en';

  @Output() valueChange = new EventEmitter<IExamination>();

  /** Shown by default. The rest sit behind the "see more" toggle. */
  private readonly primaryKeys: (keyof IExamination)[] = ['bp', 'pulse', 'temperature', 'weight', 'height'];

  expanded = false;

  private readonly allKeys: (keyof IExamination)[] = [
    'bp',
    'pulse',
    'temperature',
    'respiratoryRate',
    'spo2',
    'weight',
    'height',
    'bloodSugar',
    'painScore',
    'heartRate',
  ];

  get fields(): VitalField[] {
    return this.allKeys.map((key, i) => ({ key, label: this.vitalLabels[i] ?? key }));
  }

  get primaryFields(): VitalField[] {
    return this.fields.filter((f) => this.primaryKeys.includes(f.key));
  }

  get secondaryFields(): VitalField[] {
    return this.fields.filter((f) => !this.primaryKeys.includes(f.key));
  }

  /** Read-only/PDF/print view only — is there anything at all to show? Drives whether the
   *  whole O/E box (border, title, everything) renders or is skipped entirely. BMI doesn't
   *  factor in directly since it's derived, not entered — Weight/Height being in `allKeys`
   *  already covers the "BMI is computable" case. */
  get hasAnyVitalData(): boolean {
    return this.allKeys.some((k) => !!this.value[k]);
  }

  /** `primaryFields`/`secondaryFields` are getters — they return a brand-new array of
   *  brand-new `{key, label}` objects on every single evaluation, not just when `value`
   *  actually changes. Without `trackBy`, Angular's default *ngFor identity diffing sees a
   *  wholly new list on every change-detection pass and tears down/rebuilds every `.vital`
   *  row — including whichever `<input>` the doctor is actively typing into — which is what
   *  "loses focus/re-renders after every keystroke" looks like from the outside. `key` is
   *  stable across every re-evaluation (same `keyof IExamination` string each time), so it's
   *  a safe track identity. */
  trackByKey(_index: number, field: VitalField): string {
    return field.key;
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  /** Display value: Bangla numerals in বাংলা, raw ASCII otherwise. */
  displayValue(key: keyof IExamination): string {
    const raw = this.value[key] || '';
    return this.language === 'bn' ? toBanglaDigits(raw) : raw;
  }

  /** Units for vitals whose label doesn't already carry one (Temp/Weight/Height/SpO2 do).
   *  Same abbreviation in both languages — "bpm" isn't translated in Bangla clinical usage. */
  private readonly unitByKey: Partial<Record<keyof IExamination, string>> = {
    pulse: 'bpm',
    heartRate: 'bpm',
  };

  /** Worked example for fields where the unit alone isn't a self-explanatory hint (BP has no
   *  entry in `unitByKey` since "mmHg" isn't how doctors write it — they write "120/80"). */
  private readonly exampleByKey: Partial<Record<keyof IExamination, string>> = {
    bp: '120/80',
  };

  /** Editable-input placeholder — a numeric example (BP) or bare unit (Pulse/Heart Rate),
   *  digit-localized like `displayValue` so বাংলা mode hints "১২০/৮০" not "120/80". */
  placeholderFor(key: keyof IExamination): string {
    const example = this.exampleByKey[key];
    if (example) return this.language === 'bn' ? toBanglaDigits(example) : example;
    return this.unitByKey[key] ?? '';
  }

  /** Read-only/print view only — appends the unit to the entered value without touching what's
   *  stored or what the doctor edits (editable inputs stay on plain `displayValue`). */
  readonlyDisplayValue(key: keyof IExamination): string {
    const value = this.displayValue(key);
    const unit = this.unitByKey[key];
    return unit && value ? `${value} ${unit}` : value;
  }

  /**
   * Derived from Weight/Height — never persisted, so it can't go stale if either is edited
   * later (matches the reference prototype's `calcBMI`, same formula/rounding).
   */
  get bmi(): number | null {
    const w = parseFloat(this.value.weight || '');
    const h = parseFloat(this.value.height || '');
    if (!w || !h) return null;
    const meters = h / 100;
    return Math.round((w / (meters * meters)) * 10) / 10;
  }

  get bmiDisplay(): string {
    if (this.bmi == null) return '';
    const text = String(this.bmi);
    return this.language === 'bn' ? toBanglaDigits(text) : text;
  }

  /**
   * Fires on every keystroke, not just blur — the O/E section must never depend on a field
   * losing focus at the right moment relative to collapsing the "more vitals" toggle or
   * clicking into another section; whatever's in `this.value` is always exactly what's on
   * screen. Explicitly restores the caret in বাংলা mode: converting a typed ASCII digit to
   * its Bangla numeral on every keystroke (via `displayValue()`'s binding re-evaluating)
   * changes the string content, and simply re-setting `element.value` moves the caret to the
   * end by default — same fix the reference prototype's `useLocalizedDigitInput` uses.
   */
  onInput(key: keyof IExamination, event: Event): void {
    const el = event.target as HTMLInputElement;
    const cursor = el.selectionStart;
    this.update(key, el.value);

    if (this.language === 'bn') {
      requestAnimationFrame(() => {
        if (document.activeElement === el) {
          try {
            el.setSelectionRange(cursor, cursor);
          } catch {
            /* no-op */
          }
        }
      });
    }
  }

  update(key: keyof IExamination, raw: string): void {
    // Normalize any Bangla numerals the doctor typed/saw back to ASCII before storing.
    const normalized = this.language === 'bn' ? toAsciiDigits(raw) : raw;
    this.valueChange.emit({ ...this.value, [key]: normalized || null });
  }
}
