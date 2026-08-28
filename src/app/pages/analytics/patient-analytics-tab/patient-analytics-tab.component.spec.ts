import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IPatientAnalyticsResponse } from '@core/interfaces/analytics/analytics.interface';
import { PatientAnalyticsTabComponent } from './patient-analytics-tab.component';

describe('PatientAnalyticsTabComponent', () => {
  let component: PatientAnalyticsTabComponent;
  let fixture: ComponentFixture<PatientAnalyticsTabComponent>;

  const analytics: IPatientAnalyticsResponse = {
    newPatients: 4,
    returningPatients: 2,
    newRegistrationTrend: [{ bucketKey: '2026-01-01', count: 2 }],
    averageVisitsPerPatient: 1.5,
    topDiagnoses: [{ diagnosis: 'Flu', count: 3 }],
    chronicDiagnosisPatterns: [{ patientId: 1, patientName: 'Alice', diagnosis: 'Hypertension', occurrences: 2 }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientAnalyticsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientAnalyticsTabComponent);
    component = fixture.componentInstance;
  });

  it('should render a loading state without throwing', () => {
    component.loading = true;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render an empty state when there is no data and not loading', () => {
    component.loading = false;
    component.analytics = null;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render KPI tiles, charts, and the chronic-diagnosis table once data arrives', () => {
    component.loading = false;
    fixture.componentRef.setInput('analytics', analytics);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.registrationTrendChartData?.labels).toEqual(['2026-01-01']);
    expect(component.topDiagnosesChartData?.labels).toEqual(['Flu']);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Alice');
    expect(text).toContain('Hypertension');
  });
});
