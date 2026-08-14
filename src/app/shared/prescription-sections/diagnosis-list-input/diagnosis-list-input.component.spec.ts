import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IDiagnosisItem } from '@core/interfaces/prescriptions/prescription.interface';
import { DiagnosisListInputComponent } from './diagnosis-list-input.component';

describe('DiagnosisListInputComponent', () => {
  let fixture: ComponentFixture<DiagnosisListInputComponent>;
  let component: DiagnosisListInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiagnosisListInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosisListInputComponent);
    component = fixture.componentInstance;
  });

  it('parses one diagnosis per line with no ICD10', () => {
    const emitted: IDiagnosisItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.onBlur('Acute Pharyngitis\nUpper Respiratory Tract Infection');

    expect(emitted[0]).toEqual([
      { text: 'Acute Pharyngitis', icd10: null },
      { text: 'Upper Respiratory Tract Infection', icd10: null },
    ]);
  });

  it('parses a trailing parenthesis as the ICD10 code', () => {
    const emitted: IDiagnosisItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.onBlur('Acute Pharyngitis (J02.9)');

    expect(emitted[0]).toEqual([{ text: 'Acute Pharyngitis', icd10: 'J02.9' }]);
  });

  it('strips a leading dash or bullet from each line', () => {
    const emitted: IDiagnosisItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.onBlur('- Acute Pharyngitis\n• Fever');

    expect(emitted[0]).toEqual([
      { text: 'Acute Pharyngitis', icd10: null },
      { text: 'Fever', icd10: null },
    ]);
  });

  it('ignores blank lines', () => {
    const emitted: IDiagnosisItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.onBlur('Acute Pharyngitis\n\n   \nFever');

    expect(emitted[0].length).toBe(2);
  });
});
