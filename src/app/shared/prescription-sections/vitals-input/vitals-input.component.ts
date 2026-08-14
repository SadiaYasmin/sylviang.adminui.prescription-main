import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IExamination } from '@core/interfaces/prescriptions/prescription.interface';

interface VitalField {
  key: keyof IExamination;
  label: string;
}

/** Examination/vitals grid (US-021) — all free-text fields, matching the reference prototype. */
@Component({
  selector: 'app-vitals-input',
  standalone: false,
  templateUrl: './vitals-input.component.html',
  styleUrl: './vitals-input.component.scss',
})
export class VitalsInputComponent {
  @Input() value: IExamination = {
    bp: null,
    pulse: null,
    temperature: null,
    respiratoryRate: null,
    spo2: null,
    weight: null,
    height: null,
    bloodSugar: null,
    painScore: null,
    heartRate: null,
  };
  @Input() editable = false;
  @Input() vitalLabels: string[] = ['BP', 'Pulse', 'Temp (°F)', 'RR', 'SpO2', 'Weight (kg)', 'Height (cm)', 'Blood Sugar', 'Pain Score', 'Heart Rate'];

  @Output() valueChange = new EventEmitter<IExamination>();

  get fields(): VitalField[] {
    const keys: (keyof IExamination)[] = [
      'bp',
      'pulse',
      'temperature',
      'respiratoryRate',
      'spo2',
      'weight',
      'height',
      'bloodSugar',
      'painScore',
      'heartRate',
    ];
    return keys.map((key, i) => ({ key, label: this.vitalLabels[i] ?? key }));
  }

  update(key: keyof IExamination, raw: string): void {
    this.valueChange.emit({ ...this.value, [key]: raw || null });
  }
}
