import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-patient-info-block',
  standalone: false,
  templateUrl: './patient-info-block.component.html',
  styleUrl: './patient-info-block.component.scss',
})
export class PatientInfoBlockComponent {
  @Input() name = '';
  @Input() age = '';
  @Input() sex = '';
  @Input() phone = '';
  @Input() bloodGroup = '';
  @Input() allergies = '';
  @Input() date = '';
  @Input() rxNo = '';
  @Input() labels: Record<string, string> = {};

  label(key: string, fallback: string): string {
    return this.labels?.[key] || fallback;
  }
}
