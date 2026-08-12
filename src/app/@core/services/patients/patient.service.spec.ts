import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Patients } from '@env/environment';
import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PatientService],
    });
    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the patient list with only the provided filters as query params', () => {
    service.getPatients({ page: 2, pageSize: 20, searchTerm: '017' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Patients && r.params.get('page') === '2' && r.params.get('pageSize') === '20' && r.params.get('searchTerm') === '017');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { patients: [], totalCount: 0, pageNumber: 2, pageSize: 20 } });
  });

  it('should omit empty filters from the query params', () => {
    service.getPatients({}).subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Patients);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get a patient by id', () => {
    service.getPatientById(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Patients}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should post a create request', () => {
    const request = { name: 'Jane Roy', phone: '01712345678' };
    service.createPatient(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_Patients);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should put an update request', () => {
    const request = { name: 'Jane Roy', phone: '01712345678' };
    service.updatePatient(5, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Patients}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
