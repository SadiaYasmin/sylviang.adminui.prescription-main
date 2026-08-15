import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ManageQuickAddPresetComponent } from './manage-quick-add-preset/manage-quick-add-preset.component';
import { QuickAddListComponent } from './quick-add-list/quick-add-list.component';
import { QuickAddManagementRoutingModule } from './quick-add-management-routing.module';

@NgModule({
  declarations: [QuickAddListComponent, ManageQuickAddPresetComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule,
    QuickAddManagementRoutingModule,
    ConfirmDialogModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    SkeletonModule,
  ],
})
export class QuickAddManagementModule {}
