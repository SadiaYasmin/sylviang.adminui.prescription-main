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
    component.trend = {
      granularity: 'Month',
      points: [
        { bucketKey: '2026-01', count: 3 },
        { bucketKey: '2026-02', count: 5 },
      ],
    };

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
});
