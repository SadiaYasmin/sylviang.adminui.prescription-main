import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { MyProfileRoutingModule } from './my-profile-routing.module';
import { ProfileComponent } from './profile.component';

@NgModule({
  declarations: [ProfileComponent],
  imports: [SharedModule, MyProfileRoutingModule],
})
export class MyProfileModule {}
