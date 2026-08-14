import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { of } from 'rxjs';
import { FinalizedListComponent } from './finalized-list.component';

describe('FinalizedListComponent', () => {
  let component: FinalizedListComponent;
  let fixture: ComponentFixture<FinalizedListComponent>;
  let prescriptionServiceSpy: jasmine.SpyObj<PrescriptionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const listResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      prescriptions: [
        {
          prescriptionId: 200,
          displayCode: 'RX-2026-0200',
          patientId: 1,
          patientName: 'Kolpona Ray',
          doctorId: 10,
          doctorName: 'Dr. Alice',
          status: 'Finalized',
          savedAt: '2026-08-13T02:00:00Z',
          finalizedAt: '2026-08-13T02:00:00Z',
          diagnosisCount: 1,
          medicineCount: 2,
          investigationCount: 0,
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
    },
  };

  function configure(navigationState: { justFinalizedId?: number } | null = null) {
    prescriptionServiceSpy = jasmine.createSpyObj('PrescriptionService', ['getFinalized']);
    prescriptionServiceSpy.getFinalized.and.returnValue(of(listResponse as any));
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    routerSpy.getCurrentNavigation.and.returnValue(navigationState ? ({ extras: { state: navigationState } } as any) : null);

    TestBed.configureTestingModule({
      declarations: [FinalizedListComponent],
      providers: [
        { provide: PrescriptionService, useValue: prescriptionServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalizedListComponent);
    component = fixture.componentInstance;
  }

  it('should load finalized prescriptions on init', () => {
    configure();
    fixture.detectChanges();

    expect(component.finalized.length).toBe(1);
    expect(component.totalRecords).toBe(1);
    expect(prescriptionServiceSpy.getFinalized).toHaveBeenCalledWith({
      searchTerm: undefined,
      fromDate: undefined,
      toDate: undefined,
      page: 1,
      pageSize: component.rows,
    });
  });

  it('should clear results on a failed load', () => {
    configure();
    prescriptionServiceSpy.getFinalized.and.returnValue(of({ hasError: true, decentMessage: 'error', content: null } as any));
    fixture.detectChanges();

    expect(component.finalized).toEqual([]);
    expect(component.totalRecords).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should surface the just-finalized banner item from router navigation state', () => {
    configure({ justFinalizedId: 200 });
    fixture.detectChanges();

    expect(component.justFinalizedItem?.displayCode).toBe('RX-2026-0200');
  });

  it('should have no banner item when no navigation state was passed', () => {
    configure();
    fixture.detectChanges();

    expect(component.justFinalizedItem).toBeNull();
  });

  it('should dismiss the banner', () => {
    configure({ justFinalizedId: 200 });
    fixture.detectChanges();

    component.dismissBanner();

    expect(component.justFinalizedItem).toBeNull();
  });

  it('should reset paging to page 1 when the search term changes', () => {
    configure();
    fixture.detectChanges();
    component.currentPage = 3;

    component.onSearchTermChange('kolpona');
    component.applyDateFilter();

    expect(component.currentPage).toBe(1);
  });

  it('should send formatted from/to dates when filtering', () => {
    configure();
    fixture.detectChanges();
    prescriptionServiceSpy.getFinalized.calls.reset();
    component.fromDate = new Date(2026, 7, 1);
    component.toDate = new Date(2026, 7, 13);

    component.applyDateFilter();

    const request = prescriptionServiceSpy.getFinalized.calls.mostRecent().args[0];
    expect(request?.fromDate).toBe('2026-08-01');
    expect(request?.toDate).toBe('2026-08-13');
  });

  it('should reset all filters', () => {
    configure();
    fixture.detectChanges();
    component.searchTerm = 'kolpona';
    component.fromDate = new Date(2026, 7, 1);
    component.toDate = new Date(2026, 7, 13);
    component.currentPage = 2;

    component.resetFilters();

    expect(component.searchTerm).toBe('');
    expect(component.fromDate).toBeNull();
    expect(component.toDate).toBeNull();
    expect(component.currentPage).toBe(1);
  });

  it('should navigate to the view page with a print action', () => {
    configure();
    fixture.detectChanges();

    component.print(listResponse.content.prescriptions[0] as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions/view', 200], { queryParams: { action: 'print' } });
  });

  it('should navigate to the view page with a download action', () => {
    configure();
    fixture.detectChanges();

    component.download(listResponse.content.prescriptions[0] as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/prescriptions/view', 200], { queryParams: { action: 'download' } });
  });

  it('should paginate correctly on page change', () => {
    configure();
    fixture.detectChanges();

    component.onPageChange({ first: 20, rows: 10 });

    expect(component.currentPage).toBe(3);
    expect(component.rows).toBe(10);
  });
});
