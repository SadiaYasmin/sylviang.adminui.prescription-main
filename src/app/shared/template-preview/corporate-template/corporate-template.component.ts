import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IHospitalBranding } from '../hospital-branding.interface';
import { ITemplateConfig } from '@core/interfaces/templates/template.interface';
import { IPrescriptionContent, IPrescriptionDocument, blankPrescriptionContent } from '@core/interfaces/prescriptions/prescription.interface';
import { lineTint, softTint } from '../template-theme.util';
import { formatPatientInfoBlock } from '../../prescription-sections/prescription-display.util';

@Component({
  selector: 'app-corporate-template',
  standalone: false,
  templateUrl: './corporate-template.component.html',
  styleUrl: './corporate-template.component.scss',
})
export class CorporateTemplateComponent {
  @Input() config!: ITemplateConfig;
  @Input() hospitalSettings: IHospitalBranding | null = null;
  @Input() language: 'en' | 'bn' = 'en';

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
    return this.config?.style?.accentColor || '#1E3A8A';
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

  get bannerStyle(): Record<string, string> {
    const header = this.config?.header;
    if (!header) return {};
    return {
      'background-color': header.bgColor || 'var(--tpl-accent-color, #1e3a8a)',
      'min-height': `${header.height}px`,
    };
  }

  get logoStyle(): Record<string, string> {
    const size = this.config?.header?.logoSize || 72;
    return { width: `${size}px`, height: `${size}px` };
  }

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

  /** See ClassicTemplateComponent.examinationLabels for why this is separate from `vitals`. */
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
