import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { DoctorDetailsComponent } from './doctor-details/doctor-details.component';
import { DoctorManagementRoutingModule } from './doctor-management-routing.module';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { ManageDoctorComponent } from './manage-doctor/manage-doctor.component';

@NgModule({
  declarations: [DoctorListComponent, ManageDoctorComponent, DoctorDetailsComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    DoctorManagementRoutingModule,
    RouterModule,
    TranslateModule,
    ConfirmDialogModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
    InputNumberModule,
    ChartModule,
  ],
})
export class DoctorManagementModule {}
