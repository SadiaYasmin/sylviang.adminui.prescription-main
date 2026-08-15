import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Analytics } from '@env/environment';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AnalyticsService],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get medicine analytics', () => {
    service.getMedicineAnalytics().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Analytics}/medicines`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get the doctor leaderboard', () => {
    service.getDoctorLeaderboard().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Analytics}/doctors/leaderboard`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should get the prescription trend with the granularity as a query param', () => {
    service.getPrescriptionTrend('Week').subscribe();

    const req = httpMock.expectOne((r) => r.url === `${BASE_URL_Analytics}/prescription-trend` && r.params.get('granularity') === 'Week');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get patient analytics', () => {
    service.getPatientAnalytics().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Analytics}/patients`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get the executive summary', () => {
    service.getExecutiveSummary().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Analytics}/executive-summary`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it("should get the caller's own doctor stats", () => {
    service.getMyDoctorStats().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Analytics}/my/doctor-stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it("should get the caller's own staff stats", () => {
    service.getMyStaffStats().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Analytics}/my/staff-stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
