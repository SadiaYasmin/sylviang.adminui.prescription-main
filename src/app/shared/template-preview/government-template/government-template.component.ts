import { Component, Input } from '@angular/core';
import { IHospitalSettings } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { ITemplateConfig } from '@core/interfaces/templates/template.interface';

/**
 * Government-type prescriptions are, by product rule, always black & white — this is
 * a real requirement (compact, maximum writing space, no branding color noise), not a
 * missing feature. To make sure that rule survives future CSS/config tweaks, this
 * component structurally never reads `config.header.bgColor`, `config.footer.bgColor`,
 * or `config.style.accentColor` into any style binding — ink/border-only styling is
 * hardcoded below regardless of what those fields contain. The Classic and Corporate
 * variants are the ones that honor those color fields.
 */
@Component({
  selector: 'app-government-template',
  standalone: false,
  templateUrl: './government-template.component.html',
  styleUrl: './government-template.component.scss',
})
export class GovernmentTemplateComponent {
  @Input() config!: ITemplateConfig;
  @Input() hospitalSettings: IHospitalSettings | null = null;
  @Input() language: 'en' | 'bn' = 'en';

  label(key: string, fallback: string): string {
    return this.config?.labels?.[key] || fallback;
  }

  get rootStyle(): Record<string, string> {
    const style = this.config?.style;
    if (!style) return {};
    // Deliberately omits style.accentColor — government layout is always monochrome.
    return {
      '--tpl-font-size': `${style.fontSize}px`,
      '--tpl-font-family': this.fontFamilyCss(style.fontFamily),
      '--tpl-section-spacing': `${style.sectionSpacing}px`,
      '--tpl-border-radius': '0px',
    };
  }

  get headerStyle(): Record<string, string> {
    const header = this.config?.header;
    if (!header) return {};
    // Deliberately omits header.bgColor — always plain white/ink.
    return {
      height: `${header.height}px`,
      'border-bottom': `1px solid #000`,
    };
  }

  get footerStyle(): Record<string, string> {
    const footer = this.config?.footer;
    if (!footer) return {};
    // Deliberately omits footer.bgColor — always plain white/ink.
    return {
      'min-height': `${footer.height}px`,
      'border-top': `1px solid #000`,
    };
  }

  get logoStyle(): Record<string, string> {
    const size = this.config?.header?.logoSize || 36;
    return { width: `${size}px`, height: `${size}px`, filter: 'grayscale(1)' };
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

  get slogan(): string {
    if (!this.hospitalSettings) return '';
    return this.language === 'bn' ? this.hospitalSettings.sloganBn : this.hospitalSettings.slogan;
  }

  get qrMessage(): string {
    const footer = this.config?.footer;
    if (!footer) return '';
    return this.language === 'bn' ? footer.qrMessageBn : footer.qrMessage;
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
