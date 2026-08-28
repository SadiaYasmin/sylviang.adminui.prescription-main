import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionTrendsTabComponent } from './prescription-trends-tab.component';

describe('PrescriptionTrendsTabComponent', () => {
  let component: PrescriptionTrendsTabComponent;
  let fixture: ComponentFixture<PrescriptionTrendsTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrescriptionTrendsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionTrendsTabComponent);
    component = fixture.componentInstance;
  });

  it('should render a loading state without throwing', () => {
    component.loading = true;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render an empty state when there is no data and not loading', () => {
    component.loading = false;
    component.trend = null;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should build line chart data from the trend points', () => {
    component.loading = false;
    fixture.componentRef.setInput('trend', {
      granularity: 'Month',
      points: [
        { bucketKey: '2026-01', count: 3 },
        { bucketKey: '2026-02', count: 5 },
      ],
    });

    fixture.detectChanges();

    expect(component.chartData?.labels).toEqual(['2026-01', '2026-02']);
    expect(component.chartData?.datasets[0].data).toEqual([3, 5]);
  });

  it('should emit granularityChange only when a different granularity is selected', () => {
    component.granularity = 'Day';
    const emitted: string[] = [];
    component.granularityChange.subscribe((g) => emitted.push(g));

    component.selectGranularity('Day'); // same value — no-op
    component.selectGranularity('Week');

    expect(emitted).toEqual(['Week']);
  });

  it('should treat an all-zero busiest-hours histogram as no data for the peak-hours chart', () => {
    fixture.componentRef.setInput('busiestHours', { hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })) });

    expect(component.peakHoursChartData).toBeNull();
  });

  it('should build peak-hours chart data with AM/PM labels, only for hours with activity', () => {
    fixture.componentRef.setInput('busiestHours', {
      hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: hour === 15 ? 4 : hour === 0 ? 2 : 0 })),
    });

    expect(component.peakHoursChartData?.labels).toEqual(['12:00 AM', '3:00 PM']);
    expect(component.peakHoursChartData?.datasets[0].data).toEqual([2, 4]);
  });

  it('should treat a null busiest-hours response as no data for the peak-hours chart', () => {
    fixture.componentRef.setInput('busiestHours', null);

    expect(component.peakHoursChartData).toBeNull();
  });

  it('should treat an empty leaderboard as no data for the prescriptions-per-doctor chart', () => {
    fixture.componentRef.setInput('leaderboard', []);

    expect(component.prescriptionsPerDoctorChartData).toBeNull();
  });

  it('should build prescriptions-per-doctor chart data sorted highest to lowest, keeping zero-prescription doctors on the axis', () => {
    fixture.componentRef.setInput('leaderboard', [
      { doctorId: 1, fullName: 'Dr. Low', patientsConsulted: 1, prescriptionsCreated: 2, medicinesPrescribed: 2, avgRxPerConsultation: 1, avgMedsPerRx: 1 },
      { doctorId: 2, fullName: 'Dr. High', patientsConsulted: 5, prescriptionsCreated: 9, medicinesPrescribed: 12, avgRxPerConsultation: 1.6, avgMedsPerRx: 1.5 },
      { doctorId: 3, fullName: 'Dr. Idle', patientsConsulted: 0, prescriptionsCreated: 0, medicinesPrescribed: 0, avgRxPerConsultation: 0, avgMedsPerRx: 0 },
    ]);

    expect(component.prescriptionsPerDoctorChartData?.labels).toEqual(['Dr. High', 'Dr. Low', 'Dr. Idle']);
    expect(component.prescriptionsPerDoctorChartData?.datasets[0].data).toEqual([9, 2, 0]);
  });

  it('should keep a lone 0-prescription doctor on the chart with a distinct (gray) bar color', () => {
    fixture.componentRef.setInput('leaderboard', [
      { doctorId: 1, fullName: 'Dr. Idle', patientsConsulted: 0, prescriptionsCreated: 0, medicinesPrescribed: 0, avgRxPerConsultation: 0, avgMedsPerRx: 0 },
    ]);

    const result = component.prescriptionsPerDoctorChartData;
    expect(result?.labels).toEqual(['Dr. Idle']);
    expect(result?.datasets[0].data).toEqual([0]);
    expect(result?.datasets[0].backgroundColor).toEqual(['#e5e7eb']);
  });
});
