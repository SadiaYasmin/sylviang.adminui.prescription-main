import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { UI_CONFIG } from '@app/@core/constants';
import { AuthService } from '@core/services/auth/auth.service';
import { PatientService } from '@core/services/patients/patient.service';
import { of, throwError } from 'rxjs';
import { PatientListComponent } from './patient-list.component';

describe('PatientListComponent', () => {
  let component: PatientListComponent;
  let fixture: ComponentFixture<PatientListComponent>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const listResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      patients: [
        {
          patientId: 1,
          name: 'Jane Roy',
          phone: '01712345678',
          dateOfBirth: null,
          age: 30,
          gender: 'Female',
          address: null,
          bloodGroup: 'APositive',
          allergyPresetId: 'None',
          allergyOtherText: null,
          savedHistory: null,
          registeredByStaffId: 1,
          registeredByName: 'Staff One',
          registeredAt: '2026-08-01T10:00:00Z',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
    },
  };

  function configure(role: string | null, queryParams: Record<string, string | null> = {}) {
    patientServiceSpy = jasmine.createSpyObj('PatientService', ['getPatients']);
    patientServiceSpy.getPatients.and.returnValue(of(listResponse as any));
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    authServiceSpy.getRole.and.returnValue(role);

    TestBed.configureTestingModule({
      declarations: [PatientListComponent],
      providers: [
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: (key: string) => queryParams[key] ?? null } } },
        },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: BreadcrumbService, useValue: jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientListComponent);
    component = fixture.componentInstance;
  }

  it('should load patients on init', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(component.patients.length).toBe(1);
    expect(component.totalRecords).toBe(1);
  });

  it('should clear patients on a failed load', () => {
    configure('Staff');
    patientServiceSpy.getPatients.and.returnValue(throwError(() => new Error('network error')));

    component.loadPatients();

    expect(component.patients).toEqual([]);
    expect(component.totalRecords).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should reset paging to page 1 and reload after the search debounce elapses', fakeAsync(() => {
    configure('Staff');
    fixture.detectChanges();
    patientServiceSpy.getPatients.calls.reset();
    component.currentPage = 3;

    component.onSearchTermChange('jane');
    tick(UI_CONFIG.searchDebounceTime);

    expect(component.currentPage).toBe(1);
    expect(patientServiceSpy.getPatients).toHaveBeenCalledWith(jasmine.objectContaining({ searchTerm: 'jane', page: 1 }));
  }));

  it('should not reload before the debounce interval elapses', fakeAsync(() => {
    configure('Staff');
    fixture.detectChanges();
    patientServiceSpy.getPatients.calls.reset();

    component.onSearchTermChange('jane');
    tick(UI_CONFIG.searchDebounceTime - 50);

    expect(patientServiceSpy.getPatients).not.toHaveBeenCalled();
    tick(50);
  }));

  it('should show the Registered By column and hide the Register button for Admin', () => {
    configure('Admin');
    fixture.detectChanges();

    expect(component.showAdminMeta).toBeTrue();
    expect(component.canRegister).toBeFalse();
    expect(component.canEdit).toBeFalse();
  });

  it('should show the Register button and hide the Registered By column for Staff', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(component.showAdminMeta).toBeFalse();
    expect(component.canRegister).toBeTrue();
    expect(component.canEdit).toBeTrue();
    expect(component.canCreateConsultation).toBeTrue();
  });

  it('should hide the Create Consultation action for non-Staff roles', () => {
    configure('Doctor');
    fixture.detectChanges();

    expect(component.canCreateConsultation).toBeFalse();
  });

  it('should open the consultation dialog with the selected patient', () => {
    configure('Staff');
    fixture.detectChanges();
    const patient = listResponse.content.patients[0] as any;

    component.openConsultationDialog(patient);

    expect(component.showConsultationDialog).toBeTrue();
    expect(component.consultationPatient).toBe(patient);
  });

  it('should allow Doctor to edit but not register, and hide the registered date', () => {
    configure('Doctor');
    fixture.detectChanges();

    expect(component.canRegister).toBeFalse();
    expect(component.canEdit).toBeTrue();
    expect(component.showRegisteredDate).toBeFalse();
    expect(component.showClinical).toBeTrue();
  });

  it('should derive a display age from date of birth when present', () => {
    configure('Staff');
    fixture.detectChanges();
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    const age = component.displayAge({ dateOfBirth: tenYearsAgo.toISOString().substring(0, 10), age: null } as any);

    expect(age).toBe('10');
  });

  it('should fall back to the stored age when date of birth is absent', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(component.displayAge({ dateOfBirth: null, age: 42 } as any)).toBe('42');
    expect(component.displayAge({ dateOfBirth: null, age: null } as any)).toBe('-');
  });

  it('should display the free-text allergy when no preset is selected', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(component.allergyDisplay({ allergyPresetId: null, allergyOtherText: 'Shellfish' } as any)).toBe('Shellfish');
    expect(component.allergyDisplay({ allergyPresetId: 'Penicillin', allergyOtherText: null } as any)).toBe('Penicillin');
    expect(component.allergyDisplay({ allergyPresetId: 'None', allergyOtherText: null } as any)).toBe('None');
  });

  it('should show no nav banner without analytics query params', () => {
    configure('Admin');
    fixture.detectChanges();

    expect(component.hasNavPatientFilter).toBeFalse();
  });

  it('should label new-patient navigation with its date range and result count', () => {
    configure('Admin', { from: '2026-08-06', to: '2026-09-05', newOnly: 'true' });
    fixture.detectChanges();

    expect(component.hasNavPatientFilter).toBeTrue();
    expect(component.navFilterLabel).toContain('new patient');
    expect(component.navFilterLabel).toContain('1');
    expect(patientServiceSpy.getPatients).toHaveBeenCalledWith(jasmine.objectContaining({ newOnly: true }));
  });

  it('should label returning-patient navigation and clear the filter on demand', () => {
    configure('Admin', { from: '2026-08-06', to: '2026-09-05', returningOnly: 'true' });
    fixture.detectChanges();

    expect(component.navFilterLabel).toContain('returning patient');

    component.clearNavFilter();

    expect(component.hasNavPatientFilter).toBeFalse();
    expect(patientServiceSpy.getPatients).toHaveBeenCalledWith(jasmine.objectContaining({ returningOnly: undefined }));
  });
});
