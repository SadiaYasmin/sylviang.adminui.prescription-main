import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { PatientService } from '@core/services/patients/patient.service';
import { ToastService } from '@core/services/misc/toast.service';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { of } from 'rxjs';
import { ManagePatientComponent } from './manage-patient.component';

describe('ManagePatientComponent', () => {
  let component: ManagePatientComponent;
  let fixture: ComponentFixture<ManagePatientComponent>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function configure(id: string | null, getPatientByIdResponse?: any) {
    patientServiceSpy = jasmine.createSpyObj('PatientService', ['getPatientById', 'createPatient', 'updatePatient']);
    if (getPatientByIdResponse) {
      patientServiceSpy.getPatientById.and.returnValue(of(getPatientByIdResponse));
    }
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const breadcrumbSpy = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    TestBed.configureTestingModule({
      declarations: [ManagePatientComponent],
      imports: [ReactiveFormsModule, SelectModule, DatePickerModule, InputNumberModule],
      providers: [
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: BreadcrumbService, useValue: breadcrumbSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagePatientComponent);
    component = fixture.componentInstance;
  }

  const existingPatientResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      profile: {
        patientId: 1,
        name: 'Jane Roy',
        phone: '01712345678',
        dateOfBirth: '2000-05-15',
        age: null,
        gender: 'Female',
        address: 'Dhanmondi',
        bloodGroup: 'APositive',
        allergyPresetId: null,
        allergyOtherText: 'Shellfish',
        savedHistory: null,
        registeredByStaffId: 2,
        registeredByName: 'Staff One',
        registeredAt: '2026-08-01T10:00:00Z',
      },
    },
  };

  it('should not call createPatient and should mark fields touched when the form is invalid', () => {
    configure(null);
    fixture.detectChanges();

    component.onSubmit();

    expect(component.patientForm.invalid).toBeTrue();
    expect(patientServiceSpy.createPatient).not.toHaveBeenCalled();
  });

  it('should require age when date of birth is absent, and not require or allow it once DOB is set', () => {
    configure(null);
    fixture.detectChanges();

    const ageControl = component.patientForm.get('age');
    const dobControl = component.patientForm.get('dateOfBirth');

    ageControl?.setValue(null);
    expect(ageControl?.invalid).toBeTrue();

    dobControl?.setValue('2000-05-15');
    expect(ageControl?.disabled).toBeTrue();

    dobControl?.setValue(null);
    expect(ageControl?.enabled).toBeTrue();
  });

  it('should create a patient with a preset allergy and navigate to the list on success', () => {
    configure(null);
    fixture.detectChanges();
    patientServiceSpy.createPatient.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { patientId: 1 } } as any));

    component.patientForm.patchValue({
      name: 'Jane Roy',
      phone: '01712345678',
      age: 25,
      allergyOption: 'Penicillin',
    });

    component.onSubmit();

    expect(patientServiceSpy.createPatient).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Jane Roy', phone: '01712345678', age: 25, allergyPresetId: 'Penicillin', allergyOtherText: null }),
    );
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/patients/patient-list']);
  });

  it('should require and send free-text allergy when Other is selected', () => {
    configure(null);
    fixture.detectChanges();

    component.patientForm.patchValue({
      name: 'Jane Roy',
      phone: '01712345678',
      age: 25,
      allergyOption: 'Other',
    });

    expect(component.isOtherAllergySelected).toBeTrue();
    expect(component.patientForm.get('allergyOtherText')?.invalid).toBeTrue();

    component.patientForm.patchValue({ allergyOtherText: 'Shellfish' });
    patientServiceSpy.createPatient.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: {} } as any));

    component.onSubmit();

    expect(patientServiceSpy.createPatient).toHaveBeenCalledWith(jasmine.objectContaining({ allergyPresetId: null, allergyOtherText: 'Shellfish' }));
  });

  it('should load the existing patient and derive the Other allergy option from free-text', () => {
    configure('1', existingPatientResponse);
    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(component.patientForm.get('name')?.value).toBe('Jane Roy');
    expect(component.patientForm.get('allergyOption')?.value).toBe('Other');
    expect(component.patientForm.get('allergyOtherText')?.value).toBe('Shellfish');
    expect(component.patientForm.get('age')?.disabled).toBeTrue();
  });

  it('should update a patient and navigate to the list on success', () => {
    configure('1', existingPatientResponse);
    fixture.detectChanges();
    patientServiceSpy.updatePatient.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: {} } as any));

    component.onSubmit();

    expect(patientServiceSpy.updatePatient).toHaveBeenCalledWith(1, jasmine.objectContaining({ name: 'Jane Roy' }));
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/patients/patient-list']);
  });

  it('should redirect to the list when the existing patient fails to load', () => {
    configure('1', { hasError: true, decentMessage: 'Not found', content: null });
    fixture.detectChanges();

    expect(toastServiceSpy.error).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/patients/patient-list']);
  });
});
