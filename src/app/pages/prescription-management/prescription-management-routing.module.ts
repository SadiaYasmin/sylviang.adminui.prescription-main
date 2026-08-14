import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { AuthoringComponent } from './authoring/authoring.component';
import { DraftListComponent } from './draft-list/draft-list.component';
import { FinalizedListComponent } from './finalized-list/finalized-list.component';
import { PrescriptionViewComponent } from './prescription-view/prescription-view.component';
import { PreferencesComponent } from './preferences/preferences.component';

const doctorOnly = { canActivate: [roleGuard], data: { roles: ['Doctor'] } };

const routes: Routes = [
  { path: '', component: AuthoringComponent, ...doctorOnly },
  { path: 'drafts', component: DraftListComponent, ...doctorOnly },
  { path: 'finalized', component: FinalizedListComponent, ...doctorOnly },
  { path: 'preferences', component: PreferencesComponent, ...doctorOnly },
  { path: 'view/:id', component: PrescriptionViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrescriptionManagementRoutingModule {}
