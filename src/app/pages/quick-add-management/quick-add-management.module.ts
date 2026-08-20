import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TemplatePreviewModule } from '@app/shared/template-preview.module';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
    TemplatePreviewModule,
    QuickAddManagementRoutingModule,
    ConfirmDialogModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SkeletonModule,
  ],
})
export class QuickAddManagementModule {}
