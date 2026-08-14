import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { of } from 'rxjs';
import { DraftListComponent } from './draft-list.component';

describe('DraftListComponent', () => {
  let component: DraftListComponent;
  let fixture: ComponentFixture<DraftListComponent>;
  let prescriptionServiceSpy: jasmine.SpyObj<PrescriptionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const listResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      prescriptions: [
        {
          prescriptionId: 100,
          displayCode: 'RX-2026-0100',
          patientId: 1,
          patientName: 'Fahim Rahman',
          doctorId: 10,
          doctorName: 'Dr. Alice',
          status: 'Draft',
          savedAt: '2026-07-16T02:00:00Z',
          finalizedAt: null,
          diagnosisCount: 0,
          medicineCount: 0,
          investigationCount: 0,
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
    },
  };

  function configure() {
    prescriptionServiceSpy = jasmine.createSpyObj('PrescriptionService', ['getDrafts']);
    prescriptionServiceSpy.getDrafts.and.returnValue(of(listResponse as any));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [DraftListComponent],
      providers: [
        { provide: PrescriptionService, useValue: prescriptionServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DraftListComponent);
    component = fixture.componentInstance;
  }

  it('should load drafts on init', () => {
    configure();
    fixture.detectChanges();

    expect(component.drafts.length).toBe(1);
    expect(component.totalRecords).toBe(1);
    expect(prescriptionServiceSpy.getDrafts).toHaveBeenCalledWith({
      searchTerm: undefined,
      date: undefined,
      page: 1,
      pageSize: component.rows,
    });
  });

  it('should clear results on a failed load', () => {
    configure();
    prescriptionServiceSpy.getDrafts.and.returnValue(of({ hasError: true, decentMessage: 'error', content: null } as any));
    fixture.detectChanges();

    expect(component.drafts).toEqual([]);
    expect(component.totalRecords).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should reset paging to page 1 when the date filter changes', () => {
    configure();
    fixture.detectChanges();
    component.currentPage = 3;

    component.date = new Date(2026, 6, 16);
    component.applyDateFilter();

    expect(component.currentPage).toBe(1);
    const request = prescriptionServiceSpy.getDrafts.calls.mostRecent().args[0];
    expect(request?.date).toBe('2026-07-16');
  });

  it('should reset all filters', () => {
    configure();
    fixture.detectChanges();
    component.searchTerm = 'fahim';
    component.date = new Date(2026, 6, 16);
    component.currentPage = 2;

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.date).toBeNull();
    expect(component.currentPage).toBe(1);
  });

  it('should navigate to the authoring page with no query params for a new prescription', () => {
    configure();
    fixture.detectChanges();

    component.newPrescription();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions']);
  });

  it('should navigate to continue editing a draft', () => {
    configure();
    fixture.detectChanges();

    component.continueDraft(listResponse.content.prescriptions[0] as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions'], { queryParams: { draftId: 100 } });
  });

  it('should navigate to view a draft read-only', () => {
    configure();
    fixture.detectChanges();

    component.view(listResponse.content.prescriptions[0] as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions/view', 100]);
  });

  it('should paginate correctly on page change', () => {
    configure();
    fixture.detectChanges();

    component.onPageChange({ first: 20, rows: 10 });

    expect(component.currentPage).toBe(3);
    expect(component.rows).toBe(10);
  });
});
