import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of, throwError } from 'rxjs';
import { ConsultationListComponent } from './consultation-list.component';

describe('ConsultationListComponent', () => {
  let component: ConsultationListComponent;
  let fixture: ComponentFixture<ConsultationListComponent>;
  let consultationServiceSpy: jasmine.SpyObj<ConsultationService>;
  let doctorServiceSpy: jasmine.SpyObj<DoctorService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const listResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      consultations: [
        {
          consultationId: 1,
          displayCode: 'CN-2026-0001',
          tokenNumber: 'T-01',
          status: 'Waiting',
          visitDate: '2026-08-11',
          checkInAt: '2026-08-11T10:00:00Z',
          patientId: 1,
          patientName: 'Jane Roy',
          patientPhone: '01712345678',
          doctorId: 2,
          doctorName: 'Dr. John',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      summary: { total: 1, waiting: 1, inProgress: 0, completed: 0 },
    },
  };

  const detailsResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      consultationId: 1,
      displayCode: 'CN-2026-0001',
      tokenNumber: 'T-01',
      status: 'Waiting',
      visitDate: '2026-08-11',
      checkInAt: '2026-08-11T10:00:00Z',
      patientId: 1,
      patientName: 'Jane Roy',
      patientPhone: '01712345678',
      doctorId: 2,
      doctorName: 'Dr. John',
      registeredByStaffId: 3,
      registeredByName: 'Staff One',
    },
  };

  function configure() {
    consultationServiceSpy = jasmine.createSpyObj('ConsultationService', ['getConsultations', 'getConsultationById']);
    consultationServiceSpy.getConsultations.and.returnValue(of(listResponse as any));
    consultationServiceSpy.getConsultationById.and.returnValue(of(detailsResponse as any));
    doctorServiceSpy = jasmine.createSpyObj('DoctorService', ['getDoctors']);
    doctorServiceSpy.getDoctors.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { doctors: [], totalCount: 0, pageNumber: 1, pageSize: 100, summary: {} } } as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warn']);

    TestBed.configureTestingModule({
      declarations: [ConsultationListComponent],
      providers: [
        { provide: ConsultationService, useValue: consultationServiceSpy },
        { provide: DoctorService, useValue: doctorServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultationListComponent);
    component = fixture.componentInstance;
  }

  it('should load consultations and doctors on init', () => {
    configure();
    fixture.detectChanges();

    expect(component.consultations.length).toBe(1);
    expect(component.totalRecords).toBe(1);
    expect(component.summary.total).toBe(1);
    expect(doctorServiceSpy.getDoctors).toHaveBeenCalled();
  });

  it('should clear consultations on a failed load', () => {
    configure();
    consultationServiceSpy.getConsultations.and.returnValue(throwError(() => new Error('network error')));

    component.loadConsultations();

    expect(component.consultations).toEqual([]);
    expect(component.totalRecords).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should reset paging to page 1 on search', () => {
    configure();
    fixture.detectChanges();
    component.currentPage = 3;

    component.applySearch();

    expect(component.currentPage).toBe(1);
  });

  it('should reset all filters', () => {
    configure();
    fixture.detectChanges();
    component.searchTerm = 'jane';
    component.dateMode = 'Range';
    component.doctorId = 2;
    component.status = 'Waiting';

    component.resetSearch();

    expect(component.searchTerm).toBe('');
    expect(component.dateMode).toBe('Today');
    expect(component.doctorId).toBeNull();
    expect(component.status).toBeNull();
  });

  it('should only send the date param when dateMode is Custom', () => {
    configure();
    fixture.detectChanges();
    consultationServiceSpy.getConsultations.calls.reset();
    component.dateMode = 'Custom';
    component.customDate = new Date(2026, 7, 11);

    component.loadConsultations();

    const request = consultationServiceSpy.getConsultations.calls.mostRecent().args[0];
    expect(request.dateMode).toBe('Custom');
    expect(request.date).toBe('2026-08-11');
    expect(request.fromDate).toBeUndefined();
    expect(request.toDate).toBeUndefined();
  });

  it('should only send from/to params when dateMode is Range', () => {
    configure();
    fixture.detectChanges();
    consultationServiceSpy.getConsultations.calls.reset();
    component.dateMode = 'Range';
    component.fromDate = new Date(2026, 7, 1);
    component.toDate = new Date(2026, 7, 10);

    component.loadConsultations();

    const request = consultationServiceSpy.getConsultations.calls.mostRecent().args[0];
    expect(request.dateMode).toBe('Range');
    expect(request.fromDate).toBe('2026-08-01');
    expect(request.toDate).toBe('2026-08-10');
    expect(request.date).toBeUndefined();
  });

  it('should map InConsultation status to a friendly display label', () => {
    configure();
    fixture.detectChanges();

    expect(component.displayStatus('InConsultation')).toBe('In Progress');
    expect(component.displayStatus('Completed')).toBe('Completed');
  });

  it('should load and show consultation details', () => {
    configure();
    fixture.detectChanges();

    component.viewDetails(listResponse.content.consultations[0] as any);

    expect(component.showDetailsDialog).toBeTrue();
    expect(component.details?.registeredByName).toBe('Staff One');
    expect(component.detailsLoading).toBeFalse();
  });

  it('should toast an error when details fail to load', () => {
    configure();
    fixture.detectChanges();
    consultationServiceSpy.getConsultationById.and.returnValue(throwError(() => new Error('network error')));

    component.viewDetails(listResponse.content.consultations[0] as any);

    expect(toastServiceSpy.error).toHaveBeenCalled();
    expect(component.detailsLoading).toBeFalse();
  });

  it('should close the details dialog and clear details', () => {
    configure();
    fixture.detectChanges();
    component.showDetailsDialog = true;
    component.details = detailsResponse.content as any;

    component.closeDetailsDialog();

    expect(component.showDetailsDialog).toBeFalse();
    expect(component.details).toBeNull();
  });

  it('should paginate correctly on page change', () => {
    configure();
    fixture.detectChanges();

    component.onPageChange({ first: 20, rows: 10 });

    expect(component.currentPage).toBe(3);
    expect(component.rows).toBe(10);
  });
});
