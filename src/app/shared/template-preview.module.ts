import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassicTemplateComponent } from './template-preview/classic-template/classic-template.component';
import { CorporateTemplateComponent } from './template-preview/corporate-template/corporate-template.component';
import { GovernmentTemplateComponent } from './template-preview/government-template/government-template.component';
import { PrescriptionQrComponent } from './template-preview/prescription-qr/prescription-qr.component';
import { TemplatePreviewComponent } from './template-preview/template-preview.component';
import { PatientInfoBlockComponent } from './patient-info-block/patient-info-block.component';
import { ChipListInputComponent } from './prescription-sections/chip-list-input/chip-list-input.component';
import { DiagnosisListInputComponent } from './prescription-sections/diagnosis-list-input/diagnosis-list-input.component';
import { VitalsInputComponent } from './prescription-sections/vitals-input/vitals-input.component';
import { MedicineListInputComponent } from './prescription-sections/medicine-list-input/medicine-list-input.component';
import { QuickAddSelectComponent } from './prescription-sections/quick-add-select/quick-add-select.component';

const PRESCRIPTION_SECTION_COMPONENTS = [
  ChipListInputComponent,
  DiagnosisListInputComponent,
  VitalsInputComponent,
  MedicineListInputComponent,
  QuickAddSelectComponent,
];

@NgModule({
  declarations: [
    PatientInfoBlockComponent,
    TemplatePreviewComponent,
    ClassicTemplateComponent,
    CorporateTemplateComponent,
    GovernmentTemplateComponent,
    PrescriptionQrComponent,
    ...PRESCRIPTION_SECTION_COMPONENTS,
  ],
  imports: [CommonModule, FormsModule],
  exports: [
    PatientInfoBlockComponent,
    TemplatePreviewComponent,
    ClassicTemplateComponent,
    CorporateTemplateComponent,
    GovernmentTemplateComponent,
    PrescriptionQrComponent,
    ...PRESCRIPTION_SECTION_COMPONENTS,
  ],
})
export class TemplatePreviewModule {}
