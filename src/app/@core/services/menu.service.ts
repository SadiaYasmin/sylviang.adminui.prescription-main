import { Injectable } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import type { IMenuItem } from '@core/interfaces/menuResponse.interface';
import { webSidebarMenuItems } from '../constants/nav-menu-items';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuSubject = new BehaviorSubject<IMenuItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public menu$ = this.menuSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadFallbackMenu();
    this.authService.currentUser$.subscribe(() => this.loadFallbackMenu());
  }

  private loadFallbackMenu(): void {
    const role = this.authService.getRole();
    const items = this.transformMenuItems(this.filterByRole(webSidebarMenuItems, role));
    this.menuSubject.next(items);
  }

  private filterByRole(items: IMenuItem[], role: string | null): IMenuItem[] {
    return items
      .filter((item) => !item.roles || item.roles.length === 0 || (role != null && item.roles.includes(role)))
      .map((item) => ({
        ...item,
        subItems: item.subItems ? this.filterByRole(item.subItems, role) : undefined,
      }));
  }

  private transformMenuItems(items: IMenuItem[]): IMenuItem[] {
    return items.map((item) => ({
      ...item,
      expanded: false,
      subItems: item.subItems ? this.transformMenuItems(item.subItems) : undefined,
    }));
  }

  getCurrentMenu(): IMenuItem[] {
    return this.menuSubject.value;
  }

  loadMenuIfNeeded(): Observable<IMenuItem[]> {
    return of(this.menuSubject.value);
  }

  refreshMenu(): Observable<IMenuItem[]> {
    return of(this.menuSubject.value);
  }

  updateActiveMenuItem(currentRoute: string): void {
    const menuItems = this.getCurrentMenu();
    const updatedMenuItems = this.updateMenuItemsActiveState(menuItems, currentRoute);
    this.menuSubject.next(updatedMenuItems);
  }

  private updateMenuItemsActiveState(items: IMenuItem[], currentRoute: string): IMenuItem[] {
    const bestHref = this.findBestMatchingHref(items, currentRoute);
    return items.map((item) => {
      const updatedItem: IMenuItem = { ...item };
      updatedItem.active = !!item.href && item.href === bestHref;
      updatedItem.expanded = item.expanded || false;
      if (item.subItems && item.subItems.length > 0) {
        updatedItem.subItems = this.updateMenuItemsActiveState(item.subItems, currentRoute);
      }
      return updatedItem;
    });
  }

  /**
   * Among sibling hrefs, several can match a route as a prefix (e.g. `/prescriptions`
   * is a prefix of `/prescriptions/preferences`). Only the longest matching href should
   * be treated as active, otherwise a shorter sibling route falsely lights up alongside it.
   */
  private findBestMatchingHref(items: IMenuItem[], currentRoute: string): string | undefined {
    let best: string | undefined;
    let bestSegmentCount = -1;
    for (const item of items) {
      if (!item.href) continue;
      // An item may match either at its concrete `href` or at a broader `activeMatch`
      // prefix (see IMenuItem.activeMatch) — try both, so e.g. /quick-add/follow-up still
      // lights up the item whose href is /quick-add/medicine.
      const matchAgainst = this.isRouteMatch(item.href, currentRoute)
        ? item.href
        : item.activeMatch && this.isRouteMatch(item.activeMatch, currentRoute)
          ? item.activeMatch
          : undefined;
      if (!matchAgainst) continue;
      const segmentCount = matchAgainst.replace(/^\//, '').split('/').length;
      if (segmentCount > bestSegmentCount) {
        bestSegmentCount = segmentCount;
        best = item.href;
      }
    }
    return best;
  }

  private isRouteMatch(menuHref: string | undefined, currentRoute: string): boolean {
    if (!menuHref) return false;
    const normalizedMenuHref = menuHref.replace(/^\//, '');
    const normalizedCurrentRoute = currentRoute.replace(/^\//, '');
    return normalizedCurrentRoute === normalizedMenuHref || normalizedCurrentRoute.startsWith(normalizedMenuHref + '/');
  }
}
