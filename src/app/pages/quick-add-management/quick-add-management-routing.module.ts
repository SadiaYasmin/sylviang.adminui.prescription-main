import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageQuickAddPresetComponent } from './manage-quick-add-preset/manage-quick-add-preset.component';
import { QuickAddListComponent } from './quick-add-list/quick-add-list.component';

// One generic list + one generic manage component shared by all 5 section types (the
// backend already models them as one entity/enum) — :section resolves via
// findQuickAddSectionByRoute rather than declaring 5 near-identical component pairs.
const routes: Routes = [
  { path: ':section', component: QuickAddListComponent },
  { path: ':section/manage', component: ManageQuickAddPresetComponent },
  { path: ':section/manage/:id', component: ManageQuickAddPresetComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuickAddManagementRoutingModule {}
