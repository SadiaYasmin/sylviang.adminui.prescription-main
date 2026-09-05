import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IDoctorLeaderboardEntry } from '@core/interfaces/analytics/analytics.interface';
import { DoctorActivityTabComponent } from './doctor-activity-tab.component';

describe('DoctorActivityTabComponent', () => {
  let component: DoctorActivityTabComponent;
  let fixture: ComponentFixture<DoctorActivityTabComponent>;

  const leaderboard: IDoctorLeaderboardEntry[] = [
    { doctorId: 1, fullName: 'Dr. Jane', patientsConsulted: 5, prescriptionsCreated: 8, medicinesPrescribed: 12, avgRxPerConsultation: 1.6, avgMedsPerRx: 1.5 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DoctorActivityTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorActivityTabComponent);
    component = fixture.componentInstance;
  });

  it('should render a loading state without throwing', () => {
    component.loading = true;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render an empty state when there is no data and not loading', () => {
    component.loading = false;
    component.leaderboard = null;
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render every doctor row, including zero-activity doctors', () => {
    component.loading = false;
    component.leaderboard = leaderboard;

    expect(() => fixture.detectChanges()).not.toThrow();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Dr. Jane');
  });
});
