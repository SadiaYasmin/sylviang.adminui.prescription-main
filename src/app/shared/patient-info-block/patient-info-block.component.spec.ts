import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientInfoBlockComponent } from './patient-info-block.component';

describe('PatientInfoBlockComponent', () => {
  let component: PatientInfoBlockComponent;
  let fixture: ComponentFixture<PatientInfoBlockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientInfoBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientInfoBlockComponent);
    component = fixture.componentInstance;
  });

  it('should render a very long patient name in full, without any truncation/ellipsis styling', () => {
    const longName = 'Mohammad Abdullah Al-Mamun Chowdhury Bin Rahman Uddin Ahmed Hossain Sarker Talukder';
    component.name = longName;
    component.labels = {};
    fixture.detectChanges();

    const nameField: HTMLElement = fixture.nativeElement.querySelector('.pib-name .pib-value');
    expect(nameField.textContent?.trim()).toBe(longName);

    // white-space:normal + wrapping is asserted via computed style, not a truncating class.
    const computed = getComputedStyle(nameField);
    expect(computed.whiteSpace).not.toBe('nowrap');
    expect(nameField.className).not.toContain('truncate');
    expect(nameField.className).not.toContain('ellipsis');
  });

  it('should render a very long allergies value in full', () => {
    const longAllergies = 'Penicillin, Sulfonamides, Aspirin, Ibuprofen, Peanuts, Shellfish, Latex, Dust, Pollen, Pet Dander';
    component.allergies = longAllergies;
    component.labels = {};
    fixture.detectChanges();

    const allergiesField: HTMLElement = fixture.nativeElement.querySelector('.pib-allergies .pib-value');
    expect(allergiesField.textContent?.trim()).toBe(longAllergies);
  });

  it('should use labels input for field labels instead of hardcoded English', () => {
    component.labels = { patientName: 'নাম' };
    component.name = 'Karim';
    fixture.detectChanges();

    const nameLabel: HTMLElement = fixture.nativeElement.querySelector('.pib-name .pib-label');
    expect(nameLabel.textContent).toContain('নাম');
  });

  it('should fall back to English defaults when no matching label key is provided', () => {
    component.labels = {};
    component.age = '34';
    fixture.detectChanges();

    const ageLabel: HTMLElement = fixture.nativeElement.querySelector('.pib-age .pib-label');
    expect(ageLabel.textContent).toContain('Age');
  });

  it('should show a dash placeholder when a field value is empty', () => {
    component.rxNo = '';
    component.labels = {};
    fixture.detectChanges();

    const rxField: HTMLElement = fixture.nativeElement.querySelector('.pib-rxno .pib-value');
    expect(rxField.textContent?.trim()).toBe('-');
  });
});
