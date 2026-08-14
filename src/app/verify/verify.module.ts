import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TemplatePreviewModule } from '@app/shared/template-preview.module';
import { VerifyComponent } from './verify.component';
import { VerifyRoutingModule } from './verify-routing.module';

@NgModule({
  declarations: [VerifyComponent],
  imports: [CommonModule, TemplatePreviewModule, VerifyRoutingModule],
})
export class VerifyModule {}
