import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics/analytics.service';
import { AuthService } from '@core/services/auth/auth.service';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let consultationServiceSpy: jasmine.SpyObj<ConsultationService>;
  let doctorPreferencesServiceSpy: jasmine.SpyObj<DoctorPreferencesService>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const queueItem = {
    consultationId: 1,
    displayCode: 'CN-2026-0001',
    tokenNumber: 'T-01',
    status: 'Waiting',
    checkInAt: '2026-08-11T10:00:00Z',
    patientId: 1,
    patientName: 'Jane Roy',
    doctorId: 2,
    doctorName: 'Dr. John',
  };

  function configure(role: string | null) {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    authServiceSpy.getRole.and.returnValue(role);
    consultationServiceSpy = jasmine.createSpyObj('ConsultationService', ['getTodaysQueue', 'getMyQueue', 'openConsultation']);
    consultationServiceSpy.getTodaysQueue.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: [queueItem] } as any));
    consultationServiceSpy.getMyQueue.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: [queueItem] } as any));
    doctorPreferencesServiceSpy = jasmine.createSpyObj('DoctorPreferencesService', ['get']);
    doctorPreferencesServiceSpy.get.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { preferredTemplateId: 1, signatureUrl: null, preferredLanguage: null } } as any));
    analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', ['getMyDoctorStats', 'getMyStaffStats']);
    analyticsServiceSpy.getMyDoctorStats.and.returnValue(
      of({
        hasError: false,
        decentMessage: 'ok',
        content: { ownPatientCount: 5, patientsConsulted: 3, draftPrescriptionCount: 1, finalizedPrescriptionCount: 2, assignedStaffCount: 1, topMedicines: [] },
      } as any),
    );
    analyticsServiceSpy.getMyStaffStats.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { patientsRegisteredByMe: 4, assignedDoctors: [] } } as any),
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsultationService, useValue: consultationServiceSpy },
        { provide: DoctorPreferencesService, useValue: doctorPreferencesServiceSpy },
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  }

  it('should load todays queue for Doctor role', () => {
    configure('Doctor');
    fixture.detectChanges();

    expect(consultationServiceSpy.getTodaysQueue).toHaveBeenCalled();
    expect(consultationServiceSpy.getMyQueue).not.toHaveBeenCalled();
    expect(component.queue.length).toBe(1);
  });

  it('should load my queue for Staff role', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(consultationServiceSpy.getMyQueue).toHaveBeenCalled();
    expect(consultationServiceSpy.getTodaysQueue).not.toHaveBeenCalled();
    expect(component.queue.length).toBe(1);
  });

  it('should not load any queue for Admin role', () => {
    configure('Admin');
    fixture.detectChanges();

    expect(consultationServiceSpy.getTodaysQueue).not.toHaveBeenCalled();
    expect(consultationServiceSpy.getMyQueue).not.toHaveBeenCalled();
  });

  it('should clear the queue on a failed load', () => {
    configure('Doctor');
    consultationServiceSpy.getTodaysQueue.and.returnValue(throwError(() => new Error('network error')));

    component.loadTodaysQueue();

    expect(component.queue).toEqual([]);
    expect(component.queueLoading).toBeFalse();
  });

  it('should map InConsultation status to a friendly display label', () => {
    configure('Doctor');
    fixture.detectChanges();

    expect(component.displayStatus('InConsultation')).toBe('In Progress');
    expect(component.displayStatus('Waiting')).toBe('Waiting');
    expect(component.displayStatus('Completed')).toBe('Completed');
  });

  it('should navigate straight into prescription authoring for the clicked consultation', () => {
    // Epic D: opening a consultation from the queue lands in live authoring — the
    // Waiting -> InConsultation transition now happens there (StartOrResumePrescriptionHandler),
    // not via a separate openConsultation() call from the dashboard.
    configure('Doctor');
    fixture.detectChanges();

    component.openConsultation(queueItem as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions'], { queryParams: { consultationId: 1 } });
    expect(consultationServiceSpy.openConsultation).not.toHaveBeenCalled();
  });

  it('should show the template-choice nudge for a Doctor with no preferred template', () => {
    configure('Doctor');
    doctorPreferencesServiceSpy.get.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { preferredTemplateId: null, signatureUrl: null, preferredLanguage: null } } as any));

    fixture.detectChanges();

    expect(component.needsTemplateChoice).toBeTrue();
  });

  it('should not show the template-choice nudge for a Doctor who already picked one', () => {
    configure('Doctor');
    fixture.detectChanges();

    expect(component.needsTemplateChoice).toBeFalse();
  });

  it('should not check template choice for non-Doctor roles', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(doctorPreferencesServiceSpy.get).not.toHaveBeenCalled();
  });

  it('should filter dashboard cards by role', () => {
    configure('Admin');
    fixture.detectChanges();

    expect(component.cards.length).toBeGreaterThan(0);
    expect(component.cards.every((c) => !c.roles || c.roles.includes('Admin'))).toBeTrue();
  });

  it('should load own scoped stats for Doctor role without disturbing the queue', () => {
    configure('Doctor');
    fixture.detectChanges();

    expect(analyticsServiceSpy.getMyDoctorStats).toHaveBeenCalled();
    expect(analyticsServiceSpy.getMyStaffStats).not.toHaveBeenCalled();
    expect(component.myDoctorStats?.ownPatientCount).toBe(5);
    expect(component.queue.length).toBe(1); // Today's Queue still renders normally
  });

  it('should load own scoped stats for Staff role without disturbing the queue', () => {
    configure('Staff');
    fixture.detectChanges();

    expect(analyticsServiceSpy.getMyStaffStats).toHaveBeenCalled();
    expect(analyticsServiceSpy.getMyDoctorStats).not.toHaveBeenCalled();
    expect(component.myStaffStats?.patientsRegisteredByMe).toBe(4);
    expect(component.queue.length).toBe(1); // My Queue still renders normally
  });

  it('should swallow a failed own-stats load without breaking the rest of the dashboard', () => {
    configure('Doctor');
    analyticsServiceSpy.getMyDoctorStats.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.myDoctorStats).toBeNull();
    expect(component.queue.length).toBe(1);
  });

  it('should not load any own-stats for Admin role', () => {
    configure('Admin');
    fixture.detectChanges();

    expect(analyticsServiceSpy.getMyDoctorStats).not.toHaveBeenCalled();
    expect(analyticsServiceSpy.getMyStaffStats).not.toHaveBeenCalled();
  });
});
