import { Component, Input } from '@angular/core';
import { IHospitalSettings } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { ITemplateConfig, TemplateType } from '@core/interfaces/templates/template.interface';

// Fixed design width the preview is authored against; when `scale` < 1 the whole
// preview is rendered at this width then CSS-scaled down, so it reads correctly
// as a small thumbnail instead of reflowing awkwardly at a tiny container width.
export const TEMPLATE_PREVIEW_DESIGN_WIDTH = 794; // ~A4 width at 96dpi
export const TEMPLATE_PREVIEW_DESIGN_HEIGHT = 1123; // ~A4 height at 96dpi, used only for thumbnail clipping

@Component({
  selector: 'app-template-preview',
  standalone: false,
  templateUrl: './template-preview.component.html',
  styleUrl: './template-preview.component.scss',
})
export class TemplatePreviewComponent {
  @Input() config!: ITemplateConfig;
  @Input() type: TemplateType = 'Classic';
  @Input() hospitalSettings: IHospitalSettings | null = null;
  @Input() scale = 1;
  @Input() language: 'en' | 'bn' = 'en';

  readonly designWidth = TEMPLATE_PREVIEW_DESIGN_WIDTH;
  readonly designHeight = TEMPLATE_PREVIEW_DESIGN_HEIGHT;

  get wrapperStyle(): Record<string, string> {
    if (!this.scale || this.scale >= 1) {
      return {};
    }
    return {
      width: `${this.designWidth}px`,
      transform: `scale(${this.scale})`,
      'transform-origin': 'top left',
    };
  }

  // Outer container is sized down to the scaled footprint so it doesn't leave a
  // full-size empty gap in a card layout.
  get outerStyle(): Record<string, string> {
    if (!this.scale || this.scale >= 1) {
      return {};
    }
    return {
      width: `${this.designWidth * this.scale}px`,
      height: `${this.designHeight * this.scale}px`,
      overflow: 'hidden',
    };
  }
}
