import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IHospitalBranding } from '../hospital-branding.interface';
import { ITemplateConfig } from '@core/interfaces/templates/template.interface';
import { IPrescriptionContent, IPrescriptionDocument, blankPrescriptionContent } from '@core/interfaces/prescriptions/prescription.interface';
import { lineTint, softTint } from '../template-theme.util';
import { formatPatientInfoBlock } from '../../prescription-sections/prescription-display.util';
import { resolveLabels } from '../prescription-labels.util';
import { translateDosage, translateDuration, translateFrequency, translateInstructions } from '@core/constants/quick-add-medicine-presets';
import { findExactMedicineDuplicateIndex } from '../../prescription-sections/medicine-duplicate.util';
import { hasExaminationData } from '../prescription-section-visibility.util';

@Component({
  selector: 'app-classic-template',
  standalone: false,
  templateUrl: './classic-template.component.html',
  styleUrl: './classic-template.component.scss',
})
export class ClassicTemplateComponent {
  @Input() config!: ITemplateConfig;
  @Input() hospitalSettings: IHospitalBranding | null = null;
  @Input() language: 'en' | 'bn' = 'en';

  /**
   * Three render modes driven by these two inputs (Epic D): editable=false + document=null
   * is Epic H's original placeholder preview (unchanged); editable=true + document is live
   * authoring; editable=false + document is read-only finalized view/print/verify.
   */
  @Input() editable = false;
  @Input() document: IPrescriptionDocument | null = null;
  /** When true, keep the signature block visually empty (no image, no scribble placeholder) — the public QR verification page uses this so the doctor's signature is never revealed to a scanner. */
  @Input() hideSignature = false;
  @Output() contentChange = new EventEmitter<IPrescriptionContent>();

  get content(): IPrescriptionContent {
    return this.document?.content ?? blankPrescriptionContent();
  }

  patchContent(patch: Partial<IPrescriptionContent>): void {
    this.contentChange.emit({ ...this.content, ...patch });
  }

  /**
   * Section-wrapper visibility for read-only/finalized/PDF/print rendering — a section with
   * genuinely no data (border, title, spacing, everything) simply doesn't render, instead of
   * showing an empty placeholder row. Each getter also passes through `true` when
   * `!this.document` (Epic H's static placeholder preview, unrelated to any real
   * prescription) so that mode is completely unaffected — only an actual empty *document*
   * gets its empty sections hidden. Template markup gates on `editable || hasX`, so live
   * authoring (where every field must stay visible to fill in) is also unaffected regardless
   * of document state. Rx/Medicine is deliberately excluded — kept exactly as before.
   */
  get hasChiefComplaints(): boolean {
    return !this.document || this.content.chiefComplaints.length > 0;
  }

  get hasHistory(): boolean {
    return !this.document || this.content.history.length > 0;
  }

  get hasExamination(): boolean {
    return !this.document || hasExaminationData(this.content.examination);
  }

  get hasDiagnoses(): boolean {
    return !this.document || this.content.diagnoses.length > 0;
  }

  get hasInvestigations(): boolean {
    return !this.document || this.content.investigations.length > 0;
  }

  get hasAdvice(): boolean {
    return !this.document || this.content.advice.length > 0;
  }

  get hasFollowUp(): boolean {
    return !this.document || !!(this.content.followUp && this.content.followUp.trim());
  }

  /** Quick Add insert handlers (US-025) — merge a preset's parsed payload into the section's list/value. */
  addInvestigationPreset(payload: { text?: string }): void {
    const text = payload?.text;
    if (text && !this.content.investigations.includes(text)) {
      this.patchContent({ investigations: [...this.content.investigations, text] });
    }
  }

  addDiagnosisPreset(payload: { text?: string; icd10?: string | null }): void {
    if (!payload?.text) return;
    this.patchContent({ diagnoses: [...this.content.diagnoses, { text: payload.text, icd10: payload.icd10 || null }] });
  }

  /**
   * Medicine name/strength are catalog identity — never translated. Dosage/Frequency/
   * Duration/Instructions are stored on the preset as literal English text (the admin
   * preset form has no language toggle); when inserting into a বাংলা prescription, map
   * each to its Bangla counterpart by position in the shared preset dictionaries — the
   * text passes through unchanged if it doesn't match a known preset (e.g. legacy data
   * or Instructions' free-typed "Custom" text), since there's no translation for that.
   */
  addMedicinePreset(payload: { medicine?: string; strength?: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }): void {
    if (!payload?.medicine) return;
    // Quick Add writes straight into content.medicines, bypassing medicine-list-input's own
    // duplicate guard entirely (that only sees manual typing/autocomplete-select) — without
    // this, clicking the same preset twice silently added two identical rows.
    if (findExactMedicineDuplicateIndex(this.content.medicines, { medicine: payload.medicine, strength: payload.strength }) !== -1) return;
    this.patchContent({
      medicines: [
        ...this.content.medicines,
        {
          medicine: payload.medicine,
          generic: null,
          strength: payload.strength || '',
          dosage: translateDosage(payload.dosage, this.language) || null,
          frequency: translateFrequency(payload.frequency, this.language) || null,
          duration: translateDuration(payload.duration, this.language) || null,
          instructions: translateInstructions(payload.instructions, this.language) || null,
        },
      ],
    });
  }

  addAdvicePreset(payload: { en?: string; bn?: string }): void {
    const text = this.language === 'bn' ? payload?.bn || payload?.en : payload?.en;
    if (text && !this.content.advice.includes(text)) {
      this.patchContent({ advice: [...this.content.advice, text] });
    }
  }

  addFollowUpPreset(payload: { en?: string; bn?: string }): void {
    const text = this.language === 'bn' ? payload?.bn || payload?.en : payload?.en;
    if (text) this.patchContent({ followUp: text });
  }

  get patientInfo() {
    return this.document ? formatPatientInfoBlock(this.document, this.language) : null;
  }

  get verifyUrl(): string | null {
    if (!this.document || this.document.status !== 'Finalized') return null;
    return `${window.location.origin}/verify?id=${this.document.displayCode}`;
  }

  /** Base dictionary picked by the doctor's currently selected language, template overrides layered on top. */
  get labels(): Record<string, string> {
    return resolveLabels(this.language, this.config?.labels);
  }

  label(key: string, fallback: string): string {
    return this.labels[key] || fallback;
  }

  get accent(): string {
    return this.config?.style?.accentColor || '#0F766E';
  }

  get rootStyle(): Record<string, string> {
    const style = this.config?.style;
    if (!style) return {};
    const accent = this.accent;
    return {
      '--tpl-font-size': `${style.fontSize}px`,
      '--tpl-font-family': this.fontFamilyCss(style.fontFamily),
      '--tpl-section-spacing': `${style.sectionSpacing}px`,
      '--tpl-border-radius': `${style.borderRadius}px`,
      '--tpl-accent-color': accent,
      '--tpl-accent-soft': softTint(accent),
      '--tpl-accent-line': lineTint(accent),
      '--tpl-vitals-columns': '1',
    };
  }

  /** O/E vitals shown as a small labelled grid, using the template's own vital labels. */
  get vitals(): string[] {
    return [
      this.label('vitalBP', 'BP'),
      this.label('vitalPulse', 'Pulse'),
      this.label('vitalTempEditable', 'Temp (°F)'),
      this.label('vitalWeightEditable', 'Weight (kg)'),
      this.label('vitalHeightEditable', 'Height (cm)'),
      this.label('vitalBMI', 'BMI'),
    ];
  }

  /**
   * Labels for the real 10-field IExamination shape, in the exact key order
   * VitalsInputComponent.fields iterates — deliberately separate from `vitals` above
   * (a 6-item BMI-inclusive list used only by the static Epic H placeholder preview,
   * where BMI is shown but isn't an actual stored/editable field here).
   */
  get examinationLabels(): string[] {
    return [
      this.label('vitalBP', 'BP'),
      this.label('vitalPulse', 'Pulse'),
      this.label('vitalTempEditable', 'Temp (°F)'),
      this.label('vitalRespiratoryRate', 'Resp. Rate'),
      this.label('vitalSpo2', 'SpO2 (%)'),
      this.label('vitalWeightEditable', 'Weight (kg)'),
      this.label('vitalHeightEditable', 'Height (cm)'),
      this.label('vitalBloodSugar', 'Blood Sugar'),
      this.label('vitalPainScore', 'Pain Score'),
      this.label('vitalHeartRate', 'Heart Rate'),
    ];
  }

  get slogan(): string {
    if (!this.hospitalSettings) return '';
    return this.language === 'bn' ? this.hospitalSettings.sloganBn : this.hospitalSettings.slogan;
  }

  get qrMessage(): string {
    const footer = this.config?.footer;
    if (!footer) return '';
    return (this.language === 'bn' ? footer.qrMessageBn : footer.qrMessage) || this.label('qrScanToVerify', 'Scan to verify');
  }

  private fontFamilyCss(choice: 'heading' | 'body' | 'bangla'): string {
    switch (choice) {
      case 'bangla':
        return "'Kalpurush', 'Baloo 2', sans-serif";
      case 'body':
        return "'Manrope', 'Baloo 2', sans-serif";
      case 'heading':
      default:
        return "'Baloo 2', sans-serif";
    }
  }
}
