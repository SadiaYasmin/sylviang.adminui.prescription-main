import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsService } from '@core/services/analytics/analytics.service';
import { of, throwError } from 'rxjs';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';

describe('AnalyticsDashboardComponent', () => {
  let component: AnalyticsDashboardComponent;
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', [
      'getExecutiveSummary',
      'getMedicineAnalytics',
      'getDoctorLeaderboard',
      'getPrescriptionTrend',
      'getPatientAnalytics',
    ]);
    analyticsServiceSpy.getExecutiveSummary.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    analyticsServiceSpy.getMedicineAnalytics.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    analyticsServiceSpy.getDoctorLeaderboard.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: [] } as any));
    analyticsServiceSpy.getPrescriptionTrend.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    analyticsServiceSpy.getPatientAnalytics.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));

    TestBed.configureTestingModule({
      declarations: [AnalyticsDashboardComponent],
      providers: [{ provide: AnalyticsService, useValue: analyticsServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should load only the Executive Summary tab on init', () => {
    fixture.detectChanges();

    expect(analyticsServiceSpy.getExecutiveSummary).toHaveBeenCalledTimes(1);
    expect(analyticsServiceSpy.getMedicineAnalytics).not.toHaveBeenCalled();
    expect(analyticsServiceSpy.getDoctorLeaderboard).not.toHaveBeenCalled();
    expect(analyticsServiceSpy.getPatientAnalytics).not.toHaveBeenCalled();
  });

  it('should lazily load a tab only the first time it is activated', () => {
    fixture.detectChanges();

    component.onTabChange('doctors');
    component.onTabChange('doctors'); // switching back — must not re-fetch
    component.onTabChange('doctors');

    expect(analyticsServiceSpy.getDoctorLeaderboard).toHaveBeenCalledTimes(1);
  });

  it('should fetch both the medicine analytics and its embedded Day trend when that tab activates', () => {
    fixture.detectChanges();

    component.onTabChange('medicines');

    expect(analyticsServiceSpy.getMedicineAnalytics).toHaveBeenCalledTimes(1);
    expect(analyticsServiceSpy.getPrescriptionTrend).toHaveBeenCalledWith('Day');
  });

  it('should re-fetch the trend when the granularity toggle changes', () => {
    fixture.detectChanges();
    component.onTabChange('trends');
    expect(analyticsServiceSpy.getPrescriptionTrend).toHaveBeenCalledWith('Day');

    component.onTrendGranularityChange('Week');

    expect(analyticsServiceSpy.getPrescriptionTrend).toHaveBeenCalledWith('Week');
    expect(component.trendGranularity).toBe('Week');
  });

  it('should not throw and should leave data null when a tab load fails', () => {
    analyticsServiceSpy.getExecutiveSummary.and.returnValue(throwError(() => new Error('network error')));

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.summary).toBeNull();
    expect(component.summaryLoading).toBeFalse();
  });
});
