import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ManageMedicineComponent } from './manage-medicine/manage-medicine.component';
import { MedicineListComponent } from './medicine-list/medicine-list.component';
import { MedicineManagementRoutingModule } from './medicine-management-routing.module';

@NgModule({
  declarations: [MedicineListComponent, ManageMedicineComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule,
    MedicineManagementRoutingModule,
    ConfirmDialogModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
    TooltipModule,
  ],
})
export class MedicineManagementModule {}
