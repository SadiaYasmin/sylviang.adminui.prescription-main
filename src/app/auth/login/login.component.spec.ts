import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should be invalid and not call AuthService when submitted empty', () => {
    component.onSubmit();

    expect(component.loginForm.invalid).toBeTrue();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should navigate to /dashboard on successful login', () => {
    authServiceSpy.login.and.returnValue(
      of({
        hasError: false,
        decentMessage: 'ok',
        content: { accessToken: 'a', refreshToken: 'r', expiresIn: 300, username: 'doctor.dev', role: 'Doctor' },
      }),
    );

    component.loginForm.setValue({ username: 'doctor.dev', password: 'DevPassword123!' });
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({ username: 'doctor.dev', password: 'DevPassword123!' });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show an inline error and not navigate on failed login', () => {
    authServiceSpy.login.and.returnValue(
      of({ hasError: true, decentMessage: 'Invalid username or password.', content: null as any }),
    );

    component.loginForm.setValue({ username: 'doctor.dev', password: 'wrong' });
    component.onSubmit();

    expect(component.loginError).toBe('Invalid username or password.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should show an inline error when the request itself errors', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { decentMessage: 'Invalid username or password.' } })));

    component.loginForm.setValue({ username: 'doctor.dev', password: 'wrong' });
    component.onSubmit();

    expect(component.loginError).toBe('Invalid username or password.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should never expose a role field in the form (role is server-derived only)', () => {
    expect(component.loginForm.contains('role')).toBeFalse();
  });
});
