import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HospitalSettingsComponent } from './hospital-settings/hospital-settings.component';
import { ManageTemplateComponent } from './manage-template/manage-template.component';
import { TemplateListComponent } from './template-list/template-list.component';

const routes: Routes = [
  {
    path: 'template-list',
    component: TemplateListComponent,
  },
  {
    path: 'manage-template',
    component: ManageTemplateComponent,
  },
  {
    path: 'manage-template/:id',
    component: ManageTemplateComponent,
  },
  {
    path: 'hospital-settings',
    component: HospitalSettingsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TemplateManagementRoutingModule {}
