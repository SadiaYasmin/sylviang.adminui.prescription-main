import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IHospitalBranding } from '../hospital-branding.interface';
import { ITemplateConfig } from '@core/interfaces/templates/template.interface';
import { IPrescriptionContent, IPrescriptionDocument, blankPrescriptionContent } from '@core/interfaces/prescriptions/prescription.interface';
import { lineTint, softTint } from '../template-theme.util';
import { formatPatientInfoBlock } from '../../prescription-sections/prescription-display.util';

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
  @Output() contentChange = new EventEmitter<IPrescriptionContent>();

  /** US-070: opt-in Bangla phonetic typing for the Follow-Up field. */
  followUpBanglaMode = false;

  get content(): IPrescriptionContent {
    return this.document?.content ?? blankPrescriptionContent();
  }

  patchContent(patch: Partial<IPrescriptionContent>): void {
    this.contentChange.emit({ ...this.content, ...patch });
  }

  get patientInfo() {
    return this.document ? formatPatientInfoBlock(this.document, this.language) : null;
  }

  get verifyUrl(): string | null {
    if (!this.document || this.document.status !== 'Finalized') return null;
    return `${window.location.origin}/verify?id=${this.document.displayCode}`;
  }

  /** Traditional prescription "Rx" red, kept fixed regardless of the branding accent. */
  readonly rxColor = '#B42318';

  label(key: string, fallback: string): string {
    return this.config?.labels?.[key] || fallback;
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
      '--tpl-rx-color': this.rxColor,
    };
  }

  get headerStyle(): Record<string, string> {
    const header = this.config?.header;
    if (!header) return {};
    return {
      'background-color': header.bgColor || 'transparent',
      'min-height': `${header.height}px`,
      'border-bottom': header.borderStyle !== 'none' ? `2px ${header.borderStyle} var(--tpl-accent-color)` : 'none',
    };
  }

  get logoStyle(): Record<string, string> {
    const size = this.config?.header?.logoSize || 56;
    return { width: `${size}px`, height: `${size}px` };
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
