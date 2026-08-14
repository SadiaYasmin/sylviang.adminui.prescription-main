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
});
