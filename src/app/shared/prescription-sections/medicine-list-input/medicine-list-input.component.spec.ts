import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMedicineItem } from '@core/interfaces/prescriptions/prescription.interface';
import { MedicineListInputComponent } from './medicine-list-input.component';

describe('MedicineListInputComponent', () => {
  let fixture: ComponentFixture<MedicineListInputComponent>;
  let component: MedicineListInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [MedicineListInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicineListInputComponent);
    component = fixture.componentInstance;
  });

  it('appends a blank medicine line on addBlank()', () => {
    component.items = [{ medicine: 'Napa', generic: null, strength: '500mg', dosage: null, frequency: null, duration: null, instructions: null }];
    const emitted: IMedicineItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.addBlank();

    expect(emitted[0].length).toBe(2);
    expect(emitted[0][1].medicine).toBe('');
  });

  it('applies a field edit when it does not collide with another line', () => {
    component.items = [
      { medicine: 'Napa', generic: null, strength: '500mg', dosage: null, frequency: null, duration: null, instructions: null },
      { medicine: 'Seclo', generic: null, strength: '20mg', dosage: null, frequency: null, duration: null, instructions: null },
    ];
    const emitted: IMedicineItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.onFieldChange(1, 'strength', '40mg');

    expect(emitted[0][1].strength).toBe('40mg');
    expect(component.duplicateRowIndex).toBeNull();
  });

  it('blocks the edit and flags the duplicate row when medicine+strength collides (case/whitespace-insensitive)', () => {
    // Same medicine name already on both rows — a single strength edit that matches
    // row 0's is enough to collide, without needing a multi-step edit sequence (the
    // component only ever diffs against its current @Input(), which this unit test
    // doesn't re-bind between calls the way the real parent component would).
    component.items = [
      { medicine: 'Napa', generic: null, strength: '500mg', dosage: null, frequency: null, duration: null, instructions: null },
      { medicine: ' NAPA ', generic: null, strength: '20mg', dosage: null, frequency: null, duration: null, instructions: null },
    ];
    const emitted: IMedicineItem[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.onFieldChange(1, 'strength', '500MG');

    expect(emitted.length).toBe(0);
    expect(component.duplicateRowIndex).toBe(0);
  });

  it('removing a row clears any duplicate flag', () => {
    component.items = [
      { medicine: 'Napa', generic: null, strength: '500mg', dosage: null, frequency: null, duration: null, instructions: null },
      { medicine: 'Napa', generic: null, strength: '500mg', dosage: null, frequency: null, duration: null, instructions: null },
    ];
    component.duplicateRowIndex = 0;

    component.remove(1);

    expect(component.duplicateRowIndex).toBeNull();
  });
});
