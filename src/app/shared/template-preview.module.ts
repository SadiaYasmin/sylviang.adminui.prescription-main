import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ClassicTemplateComponent } from './template-preview/classic-template/classic-template.component';
import { CorporateTemplateComponent } from './template-preview/corporate-template/corporate-template.component';
import { GovernmentTemplateComponent } from './template-preview/government-template/government-template.component';
import { PrescriptionQrComponent } from './template-preview/prescription-qr/prescription-qr.component';
import { TemplatePreviewComponent } from './template-preview/template-preview.component';
import { PatientInfoBlockComponent } from './patient-info-block/patient-info-block.component';

@NgModule({
  declarations: [PatientInfoBlockComponent, TemplatePreviewComponent, ClassicTemplateComponent, CorporateTemplateComponent, GovernmentTemplateComponent, PrescriptionQrComponent],
  imports: [CommonModule],
  exports: [PatientInfoBlockComponent, TemplatePreviewComponent, ClassicTemplateComponent, CorporateTemplateComponent, GovernmentTemplateComponent, PrescriptionQrComponent],
})
export class TemplatePreviewModule {}
