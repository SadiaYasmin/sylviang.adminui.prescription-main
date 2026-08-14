import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Prescriptions } from '@env/environment';
import { PrescriptionService } from './prescription.service';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrescriptionService],
    });
    service = TestBed.inject(PrescriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post to start', () => {
    const request = { consultationId: 1 };
    service.start(request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/start`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should put to save a draft', () => {
    const request = { language: 'En' as const, content: {} as any };
    service.saveDraft(5, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should post to finalize', () => {
    const request = { language: 'En' as const, content: {} as any };
    service.finalize(5, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/5/finalize`);
    expect(req.request.method).toBe('POST');
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should get drafts without a patientId filter', () => {
    service.getDrafts().subscribe();

    const req = httpMock.expectOne((r) => r.url === `${BASE_URL_Prescriptions}/drafts`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ hasError: false, decentMessage: 'ok', content: { prescriptions: [] } });
  });

  it('should get drafts with a patientId filter', () => {
    service.getDrafts({ patientId: 9 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${BASE_URL_Prescriptions}/drafts` && r.params.get('patientId') === '9');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { prescriptions: [] } });
  });

  it('should get drafts with search term and date filters', () => {
    service.getDrafts({ searchTerm: 'rahim', date: '2026-08-13' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${BASE_URL_Prescriptions}/drafts` && r.params.get('searchTerm') === 'rahim' && r.params.get('date') === '2026-08-13',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { prescriptions: [] } });
  });

  it('should get finalized prescriptions', () => {
    service.getFinalized().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/finalized`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { prescriptions: [] } });
  });

  it('should get finalized prescriptions with search term and date range filters', () => {
    service.getFinalized({ searchTerm: 'RX-2026', fromDate: '2026-08-01', toDate: '2026-08-13' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${BASE_URL_Prescriptions}/finalized` &&
        r.params.get('searchTerm') === 'RX-2026' &&
        r.params.get('fromDate') === '2026-08-01' &&
        r.params.get('toDate') === '2026-08-13',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { prescriptions: [] } });
  });

  it('should get a patient prescription history', () => {
    service.getPatientHistory(3).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/patient/3/history`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { prescriptions: [] } });
  });

  it('should get a prescription by id', () => {
    service.getById(7).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should verify a prescription by display code', () => {
    service.verify('RX-2026-0001').subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Prescriptions}/verify/RX-2026-0001`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });
});
