import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Medicines } from '@env/environment';
import { MedicineService } from './medicine.service';

describe('MedicineService', () => {
  let service: MedicineService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MedicineService],
    });
    service = TestBed.inject(MedicineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should search with a term', () => {
    service.search('napa').subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Medicines && r.params.get('search') === 'napa');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should omit the search param when the term is blank', () => {
    service.search('   ').subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Medicines);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should fetch the catalog view', () => {
    service.getCatalog('napa').subscribe();

    const req = httpMock.expectOne((r) => r.url === `${BASE_URL_Medicines}/catalog` && r.params.get('search') === 'napa');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should fetch a single medicine by id', () => {
    service.getById(1).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Medicines}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should create a medicine', () => {
    const request = { brandName: 'Napa', genericName: null, strength: '500mg', manufacturer: null, dosageForm: null, category: null };
    service.create(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_Medicines);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should update a medicine', () => {
    const request = { brandName: 'Napa Extra', genericName: null, strength: '500mg', manufacturer: null, dosageForm: null, category: null };
    service.update(1, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Medicines}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should deactivate a medicine', () => {
    service.deactivate(1).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Medicines}/1/deactivate`);
    expect(req.request.method).toBe('POST');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
