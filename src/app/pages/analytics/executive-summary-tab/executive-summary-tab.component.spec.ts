import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IExecutiveSummaryResponse } from '@core/interfaces/analytics/analytics.interface';
import { ExecutiveSummaryTabComponent } from './executive-summary-tab.component';

describe('ExecutiveSummaryTabComponent', () => {
  let component: ExecutiveSummaryTabComponent;
  let fixture: ComponentFixture<ExecutiveSummaryTabComponent>;

  const summary: IExecutiveSummaryResponse = {
    totalPatients: 10,
    totalPrescriptions: 20,
    totalMedicines: 5,
    totalDoctors: 3,
    prescriptionTrend: { current: 5, previous: 4, percentChange: 25 },
    newPatientTrend: { current: 2, previous: 0, percentChange: null },
    topMedicines: [{ name: 'Napa', count: 4 }],
    topDiagnoses: [{ diagnosis: 'Flu', count: 3 }],
    topActiveDoctors: [{ doctorId: 1, fullName: 'Dr. Jane', count: 2 }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExecutiveSummaryTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutiveSummaryTabComponent);
    component = fixture.componentInstance;
  });

  it('should render a loading state without throwing', () => {
    component.loading = true;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render an empty state when there is no data and not loading', () => {
    component.loading = false;
    component.summary = null;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render the KPI/MoM/top-5 sections once summary data arrives', () => {
    component.loading = false;
    component.summary = summary;

    expect(() => fixture.detectChanges()).not.toThrow();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Napa');
    expect(text).toContain('Flu');
    expect(text).toContain('Dr. Jane');
    expect(text).toContain('New'); // no-baseline MoM tri-state, per US-076
  });
});
