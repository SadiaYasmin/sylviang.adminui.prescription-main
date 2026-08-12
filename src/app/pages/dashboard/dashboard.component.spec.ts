import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth/auth.service';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let consultationServiceSpy: jasmine.SpyObj<ConsultationService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

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
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warn']);

    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsultationService, useValue: consultationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
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

  it('should open a consultation and refresh the queue on success', () => {
    configure('Doctor');
    fixture.detectChanges();
    consultationServiceSpy.openConsultation.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    consultationServiceSpy.getTodaysQueue.calls.reset();

    component.openConsultation(queueItem as any);

    expect(consultationServiceSpy.openConsultation).toHaveBeenCalledWith(1);
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(consultationServiceSpy.getTodaysQueue).toHaveBeenCalled();
  });

  it('should filter dashboard cards by role', () => {
    configure('Admin');
    fixture.detectChanges();

    expect(component.cards.length).toBeGreaterThan(0);
    expect(component.cards.every((c) => !c.roles || c.roles.includes('Admin'))).toBeTrue();
  });
});
