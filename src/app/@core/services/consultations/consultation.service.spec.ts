import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Consultations } from '@env/environment';
import { ConsultationService } from './consultation.service';

describe('ConsultationService', () => {
  let service: ConsultationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsultationService],
    });
    service = TestBed.inject(ConsultationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post a create consultation request', () => {
    const request = { patientId: 1, doctorId: 2, visitDate: '2026-08-11', force: false };
    service.createConsultation(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_Consultations);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: { duplicateFound: false, consultation: null, existingConsultation: null } });
  });

  it('should post to open a consultation', () => {
    service.openConsultation(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Consultations}/5/open`);
    expect(req.request.method).toBe('POST');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get today\'s queue', () => {
    service.getTodaysQueue().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Consultations}/today-queue`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should get my queue', () => {
    service.getMyQueue().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Consultations}/my-queue`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should get my assigned doctors', () => {
    service.getMyAssignedDoctors().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Consultations}/my-assigned-doctors`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should request the consultation list with only the provided filters as query params', () => {
    service.getConsultations({ page: 2, pageSize: 20, searchTerm: 'jane', dateMode: 'Custom', date: '2026-08-11', doctorId: 3, status: 'Waiting' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === BASE_URL_Consultations &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '20' &&
        r.params.get('searchTerm') === 'jane' &&
        r.params.get('dateMode') === 'Custom' &&
        r.params.get('date') === '2026-08-11' &&
        r.params.get('doctorId') === '3' &&
        r.params.get('status') === 'Waiting',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      hasError: false,
      decentMessage: 'ok',
      content: { consultations: [], totalCount: 0, pageNumber: 2, pageSize: 20, summary: { total: 0, waiting: 0, inProgress: 0, completed: 0 } },
    });
  });

  it('should omit empty filters from the query params', () => {
    service.getConsultations({}).subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Consultations);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should request the consultation list with range filters', () => {
    service.getConsultations({ dateMode: 'Range', fromDate: '2026-08-01', toDate: '2026-08-10' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Consultations && r.params.get('fromDate') === '2026-08-01' && r.params.get('toDate') === '2026-08-10');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get a consultation by id', () => {
    service.getConsultationById(7).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Consultations}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
