import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { PatientService } from '@core/services/patients/patient.service';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of } from 'rxjs';
import { AuthoringComponent } from './authoring.component';

describe('AuthoringComponent', () => {
  let component: AuthoringComponent;
  let fixture: ComponentFixture<AuthoringComponent>;
  let prescriptionServiceSpy: jasmine.SpyObj<PrescriptionService>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let doctorPreferencesServiceSpy: jasmine.SpyObj<DoctorPreferencesService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const notConsultedPatient = {
    patientId: 1,
    name: 'Not Consulted Nadia',
    phone: '01711111111',
    age: 30,
    gender: 'Female',
    todayConsultationId: null,
    todayConsultationStatus: null,
    todayPrescriptionId: null,
  };

  const waitingPatient = {
    patientId: 2,
    name: 'Waiting Wendy',
    phone: '01722222222',
    age: 28,
    gender: 'Female',
    todayConsultationId: 100,
    todayConsultationStatus: 'Waiting',
    todayPrescriptionId: null,
  };

  const completedPatient = {
    patientId: 3,
    name: 'Completed Cara',
    phone: '01733333333',
    age: 40,
    gender: 'Female',
    todayConsultationId: 101,
    todayConsultationStatus: 'Completed',
    todayPrescriptionId: 200,
  };

  function configure(queryParams: Record<string, string> = {}) {
    prescriptionServiceSpy = jasmine.createSpyObj('PrescriptionService', ['start', 'saveDraft', 'finalize']);
    patientServiceSpy = jasmine.createSpyObj('PatientService', ['getDoctorQueue']);
    patientServiceSpy.getDoctorQueue.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { patients: [notConsultedPatient, waitingPatient, completedPatient] } } as any),
    );
    doctorPreferencesServiceSpy = jasmine.createSpyObj('DoctorPreferencesService', ['update']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [AuthoringComponent],
      providers: [
        { provide: PrescriptionService, useValue: prescriptionServiceSpy },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: DoctorPreferencesService, useValue: doctorPreferencesServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthoringComponent);
    component = fixture.componentInstance;
  }

  it('should default to the patient picker and load the queue when no query params are present', () => {
    configure();
    fixture.detectChanges();

    expect(component.needsPatientPick).toBeTrue();
    expect(component.queueFilter).toBe('TodayQueue');
    expect(patientServiceSpy.getDoctorQueue).toHaveBeenCalledWith({ queueFilter: 'TodayQueue', searchTerm: undefined });
    expect(component.patientResults.length).toBe(3);
  });

  it('should reload the queue when the filter changes', () => {
    configure();
    fixture.detectChanges();
    patientServiceSpy.getDoctorQueue.calls.reset();

    component.queueFilter = 'AllRegistered';
    component.onQueueFilterChange();

    expect(patientServiceSpy.getDoctorQueue).toHaveBeenCalledWith({ queueFilter: 'AllRegistered', searchTerm: undefined });
  });

  it('should clear results on a failed queue load', () => {
    configure();
    patientServiceSpy.getDoctorQueue.and.returnValue(of({ hasError: true, decentMessage: 'error', content: null } as any));
    fixture.detectChanges();

    expect(component.patientResults).toEqual([]);
    expect(component.patientResultsLoading).toBeFalse();
  });

  it('should show the not-consulted badge and Start Consultation label for a patient with no consultation today', () => {
    configure();
    fixture.detectChanges();

    expect(component.statusBadge(notConsultedPatient as any).modifierClass).toBe('status-badge--not-consulted');
    expect(component.rowActionLabel(notConsultedPatient as any)).toBe('Start Consultation');
  });

  it('should show the waiting badge and Continue label for a patient waiting today', () => {
    configure();
    fixture.detectChanges();

    expect(component.statusBadge(waitingPatient as any).modifierClass).toBe('status-badge--waiting');
    expect(component.rowActionLabel(waitingPatient as any)).toBe('Continue');
  });

  it('should show the completed badge and View Prescription label for a patient completed today', () => {
    configure();
    fixture.detectChanges();

    expect(component.statusBadge(completedPatient as any).modifierClass).toBe('status-badge--completed');
    expect(component.rowActionLabel(completedPatient as any)).toBe('View Prescription');
  });

  it('should quick-create with patientId when selecting a not-consulted patient', () => {
    configure();
    prescriptionServiceSpy.start.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { duplicateActiveFound: false, unfinishedDraftFound: false, unfinishedDrafts: [], document: null } } as any),
    );
    fixture.detectChanges();

    component.selectPatientRow(notConsultedPatient as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions'], { queryParams: { patientId: 1 } });
    expect(prescriptionServiceSpy.start).toHaveBeenCalledWith({ consultationId: null, patientId: 1, prescriptionId: null, force: false });
  });

  it('should resume the existing consultation when selecting a waiting patient', () => {
    configure();
    prescriptionServiceSpy.start.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { duplicateActiveFound: false, unfinishedDraftFound: false, unfinishedDrafts: [], document: null } } as any),
    );
    fixture.detectChanges();

    component.selectPatientRow(waitingPatient as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions'], { queryParams: { consultationId: 100 } });
    expect(prescriptionServiceSpy.start).toHaveBeenCalledWith({ consultationId: 100, patientId: null, prescriptionId: null, force: false });
  });

  it('should navigate straight to the finalized prescription for a completed-today patient', () => {
    configure();
    fixture.detectChanges();

    component.selectPatientRow(completedPatient as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions/view', 200]);
    expect(prescriptionServiceSpy.start).not.toHaveBeenCalled();
  });

  it('should skip the patient picker and start immediately when a consultationId query param is present', () => {
    configure({ consultationId: '55' });
    prescriptionServiceSpy.start.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { duplicateActiveFound: false, unfinishedDraftFound: false, unfinishedDrafts: [], document: { prescriptionId: 9 } } } as any),
    );

    fixture.detectChanges();

    expect(component.needsPatientPick).toBeFalse();
    expect(prescriptionServiceSpy.start).toHaveBeenCalledWith({ consultationId: 55, patientId: null, prescriptionId: null, force: false });
    expect(component.document).toEqual({ prescriptionId: 9 } as any);
  });

  it('should surface an already-active consultation as a duplicate warning', () => {
    configure({ patientId: '7' });
    prescriptionServiceSpy.start.and.returnValue(
      of({
        hasError: false,
        decentMessage: 'ok',
        content: {
          duplicateActiveFound: true,
          existingActiveConsultation: { consultationId: 5, displayCode: 'CN-1', tokenNumber: 'T-01', status: 'Waiting' },
          unfinishedDraftFound: false,
          unfinishedDrafts: [],
          document: null,
        },
      } as any),
    );

    fixture.detectChanges();

    expect(component.duplicateActive?.consultationId).toBe(5);
    expect(component.document).toBeNull();
  });
});
