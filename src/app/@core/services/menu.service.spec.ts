import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth/auth.service';
import { BehaviorSubject } from 'rxjs';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let currentUserSubject: BehaviorSubject<{ username: string; role: string } | null>;
  let authServiceStub: Partial<AuthService> & { getRole: jasmine.Spy };

  function setup(role: string | null) {
    currentUserSubject = new BehaviorSubject<{ username: string; role: string } | null>(null);
    authServiceStub = {
      currentUser$: currentUserSubject.asObservable(),
      getRole: jasmine.createSpy('getRole').and.returnValue(role),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceStub }],
    });

    return TestBed.inject(MenuService);
  }

  it('should hide role-gated items (Doctor Management) when no role is logged in', () => {
    const service = setup(null);

    const menu = service.getCurrentMenu();

    expect(menu.some((item) => item.title === 'Doctor Management')).toBeFalse();
  });

  it('should hide role-gated items for a Doctor role', () => {
    const service = setup('Doctor');

    const menu = service.getCurrentMenu();

    expect(menu.some((item) => item.title === 'Doctor Management')).toBeFalse();
  });

  it('should show role-gated items for an Admin role', () => {
    const service = setup('Admin');

    const menu = service.getCurrentMenu();

    expect(menu.some((item) => item.title === 'Doctor Management')).toBeTrue();
  });

  it('should always show items with no roles restriction', () => {
    const service = setup(null);

    const menu = service.getCurrentMenu();

    expect(menu.some((item) => item.title === 'Dashboard')).toBeTrue();
  });

  it('should refresh the menu when the logged-in user changes', () => {
    const service = setup(null);
    expect(service.getCurrentMenu().some((item) => item.title === 'Doctor Management')).toBeFalse();

    authServiceStub.getRole.and.returnValue('Admin');
    currentUserSubject.next({ username: 'admin', role: 'Admin' });

    expect(service.getCurrentMenu().some((item) => item.title === 'Doctor Management')).toBeTrue();
  });
});
