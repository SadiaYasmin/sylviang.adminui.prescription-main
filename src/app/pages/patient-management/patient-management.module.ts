import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { CreateConsultationDialogComponent } from './create-consultation-dialog/create-consultation-dialog.component';
import { ManagePatientComponent } from './manage-patient/manage-patient.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientManagementRoutingModule } from './patient-management-routing.module';

@NgModule({
  declarations: [PatientListComponent, ManagePatientComponent, CreateConsultationDialogComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    PatientManagementRoutingModule,
    RouterModule,
    TranslateModule,
    TableModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
    InputNumberModule,
    DialogModule,
    ConfirmDialogModule,
    TextareaModule,
  ],
})
export class PatientManagementModule {}
