import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TemplatePreviewModule } from '@app/shared/template-preview.module';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { HospitalSettingsComponent } from './hospital-settings/hospital-settings.component';
import { ManageTemplateComponent } from './manage-template/manage-template.component';
import { TemplateListComponent } from './template-list/template-list.component';
import { TemplateManagementRoutingModule } from './template-management-routing.module';

@NgModule({
  declarations: [TemplateListComponent, ManageTemplateComponent, HospitalSettingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule,
    TemplatePreviewModule,
    TemplateManagementRoutingModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    InputNumberModule,
    TabsModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
})
export class TemplateManagementModule {}
