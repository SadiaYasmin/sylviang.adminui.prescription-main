import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMedicineAnalyticsResponse } from '@core/interfaces/analytics/analytics.interface';
import { MedicinePrescriptionTabComponent } from './medicine-prescription-tab.component';

describe('MedicinePrescriptionTabComponent', () => {
  let component: MedicinePrescriptionTabComponent;
  let fixture: ComponentFixture<MedicinePrescriptionTabComponent>;

  const analytics: IMedicineAnalyticsResponse = {
    topPrescribedMedicines: [{ name: 'Napa', count: 10 }],
    categoryBreakdown: [{ category: 'Analgesic', count: 10 }],
    rarelyUsedMedicines: [{ name: 'NeverUsed', count: 0 }],
    coPrescribedPairs: [{ medicineA: 'Napa', medicineB: 'Seclo', pairLabel: 'Napa + Seclo', count: 2 }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MedicinePrescriptionTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicinePrescriptionTabComponent);
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

  it('should build chart data and render tables once analytics data arrives', () => {
    component.loading = false;
    component.analytics = analytics;
    component.trend = { granularity: 'Day', points: [{ bucketKey: '2026-01-01', count: 2 }] };

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.topMedicinesChartData?.labels).toEqual(['Napa']);
    expect(component.categoryChartData?.labels).toEqual(['Analgesic']);
    expect(component.trendChartData?.labels).toEqual(['2026-01-01']);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('NeverUsed');
    expect(text).toContain('Napa + Seclo');
  });
});
