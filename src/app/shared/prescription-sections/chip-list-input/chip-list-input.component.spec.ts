import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChipListInputComponent } from './chip-list-input.component';

describe('ChipListInputComponent', () => {
  let fixture: ComponentFixture<ChipListInputComponent>;
  let component: ChipListInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ChipListInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipListInputComponent);
    component = fixture.componentInstance;
  });

  it('emits a new array with the trimmed draft appended when add() is called', () => {
    component.items = ['Fever'];
    component.draft = '  Cough  ';
    const emitted: string[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.add();

    expect(emitted).toEqual([['Fever', 'Cough']]);
    expect(component.draft).toBe('');
  });

  it('does not emit when the draft is blank', () => {
    component.items = ['Fever'];
    component.draft = '   ';
    const emitted: string[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.add();

    expect(emitted.length).toBe(0);
  });

  it('emits a new array with the item at the given index removed', () => {
    component.items = ['Fever', 'Cough', 'Headache'];
    const emitted: string[][] = [];
    component.itemsChange.subscribe((v) => emitted.push(v));

    component.remove(1);

    expect(emitted).toEqual([['Fever', 'Headache']]);
  });
});
