import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Auth } from '@env/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should store the session and expose the current user on successful login', () => {
    const validPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }));
    const fakeAccessToken = `header.${validPayload}.sig`;

    service.login({ username: 'doctor.dev', password: 'DevPassword123!' }).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Auth}/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      hasError: false,
      decentMessage: 'ok',
      content: { accessToken: fakeAccessToken, refreshToken: 'refresh-1', expiresIn: 300, username: 'doctor.dev', role: 'Doctor' },
    });

    expect(service.getAccessToken()).toBe(fakeAccessToken);
    expect(service.getRefreshToken()).toBe('refresh-1');
    expect(service.getRole()).toBe('Doctor');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should not store a session when login returns hasError', () => {
    service.login({ username: 'doctor.dev', password: 'wrong' }).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Auth}/login`);
    req.flush({ hasError: true, decentMessage: 'Invalid username or password.', content: null });

    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should clear the session on logout', () => {
    localStorage.setItem('pms_access_token', 'access-1');
    localStorage.setItem('pms_refresh_token', 'refresh-1');
    localStorage.setItem('pms_user', JSON.stringify({ username: 'doctor.dev', role: 'Doctor' }));

    service.logout().subscribe();
    const req = httpMock.expectOne(`${BASE_URL_Auth}/logout`);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('isAuthenticated should be false when the stored token is expired', () => {
    const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }));
    localStorage.setItem('pms_access_token', `header.${expiredPayload}.sig`);

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('isAuthenticated should be false when there is no token at all', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });
});
