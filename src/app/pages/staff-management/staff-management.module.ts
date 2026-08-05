import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ManageStaffComponent } from './manage-staff/manage-staff.component';
import { StaffListComponent } from './staff-list/staff-list.component';
import { StaffManagementRoutingModule } from './staff-management-routing.module';

@NgModule({
  declarations: [StaffListComponent, ManageStaffComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    StaffManagementRoutingModule,
    RouterModule,
    TranslateModule,
    ConfirmDialogModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
    CheckboxModule,
  ],
})
export class StaffManagementModule {}
