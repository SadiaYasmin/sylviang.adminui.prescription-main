import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ConsultationListComponent } from './consultation-list/consultation-list.component';
import { ConsultationManagementRoutingModule } from './consultation-management-routing.module';

@NgModule({
  declarations: [ConsultationListComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    ConsultationManagementRoutingModule,
    RouterModule,
    TranslateModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
  ],
})
export class ConsultationManagementModule {}
