import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TemplatePreviewModule } from '@app/shared/template-preview.module';
import { AuthoringComponent } from './authoring/authoring.component';
import { DraftListComponent } from './draft-list/draft-list.component';
import { FinalizedListComponent } from './finalized-list/finalized-list.component';
import { PrescriptionViewComponent } from './prescription-view/prescription-view.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { PrescriptionManagementRoutingModule } from './prescription-management-routing.module';

@NgModule({
  declarations: [AuthoringComponent, DraftListComponent, FinalizedListComponent, PrescriptionViewComponent, PreferencesComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, TemplatePreviewModule, PrescriptionManagementRoutingModule],
})
export class PrescriptionManagementModule {}
