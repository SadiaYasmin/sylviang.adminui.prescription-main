import { Route, Router, Routes } from '@angular/router';
import { ShellComponent } from '@app/shell/shell.component';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import type { IMenuItem } from '@app/@core/interfaces/menuResponse.interface';

export class Shell {
  static childRoutes(routes: Routes): Route {
    return {
      path: '',
      component: ShellComponent,
      children: routes,
      data: { reuse: true },
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class ShellService {
  navicon = new BehaviorSubject<NavMode>(NavMode.Free);
  navModeSubject = new BehaviorSubject<NavMode>(NavMode.Free);
  navMode$ = this.navModeSubject.asObservable();
  navicon$ = this.navModeSubject.asObservable();

  constructor(private readonly _router: Router) {}

  toggleNavMode(): void {
    const mode = this.navModeSubject.getValue();
    this.navModeSubject.next(mode === NavMode.Free ? NavMode.Locked : NavMode.Free);
    this.navicon.next(mode === NavMode.Free ? NavMode.Locked : NavMode.Free);
  }

  activeNavTab(items: IMenuItem[], extendedItem: number): void {
    // Strip query string/fragment before splitting into path segments — a route like
    // /analytics?tab=medicines otherwise glues "?tab=medicines" onto the last segment,
    // which never matches any menu item's href and leaves the sidebar showing nothing active.
    const path = this._router.url.split('?')[0].split('#')[0];
    const urlSegments = path.split('/').filter((segment) => segment.length > 0);
    const bestTopHref = this.findBestMatchingHref(items, urlSegments);

    items.forEach((item, index) => {
      const isActive = !!item.href && item.href === bestTopHref;
      item.active = isActive;

      if (isActive && extendedItem) {
        extendedItem = index;
      }

      if (item.subItems) {
        const bestSubHref = this.findBestMatchingHref(item.subItems, urlSegments);
        item.subItems.forEach((subItem) => {
          subItem.active = !!subItem.href && subItem.href === bestSubHref;
        });
      }
    });
  }

  /**
   * Among sibling hrefs, several can match a route as a prefix (e.g. `/prescriptions`
   * is a prefix of `/prescriptions/preferences`). Only the longest matching href should
   * be treated as active, otherwise a shorter sibling route falsely lights up alongside it.
   *
   * Also checks `item.activeMatch` (a broader prefix an item should stay lit up under, e.g.
   * `/quick-add` for the item whose concrete `href` is `/quick-add/medicine`) — this must stay
   * in sync with MenuService.findBestMatchingHref's identical activeMatch handling, since both
   * run on every NavigationEnd and this one runs last, overwriting the other's `.active` flags.
   * Without it, only the Medicine tab (the item's literal href) ever lit up in the sidebar and
   * every other Quick Add tab (Investigation, Diagnosis, Advice, Follow-Up) showed nothing selected.
   */
  private findBestMatchingHref(items: IMenuItem[], urlSegments: string[]): string | undefined {
    let best: string | undefined;
    let bestSegmentCount = -1;
    const segmentsOf = (path: string) => path.split('/').filter((segment) => segment.length > 0);
    const matches = (segments: string[]) => segments.every((segment, i) => segment === urlSegments[i]);

    for (const item of items) {
      if (!item.href) continue;
      const hrefSegments = segmentsOf(item.href);
      const activeMatchSegments = item.activeMatch ? segmentsOf(item.activeMatch) : null;

      const matchedSegments = matches(hrefSegments) ? hrefSegments : activeMatchSegments && matches(activeMatchSegments) ? activeMatchSegments : null;
      if (!matchedSegments) continue;

      if (matchedSegments.length > bestSegmentCount) {
        bestSegmentCount = matchedSegments.length;
        best = item.href;
      }
    }
    return best;
  }

  activateNavItem(index: number, navItems: IMenuItem[]): void {
    const item = navItems[index];

    setTimeout(() => {
      const element = document.getElementById(`menu-item-${index}`);
      const navElement = document.querySelector('nav');

      if (element && navElement) {
        const elementRect = element.getBoundingClientRect();
        const navRect = navElement.getBoundingClientRect();
        const relativeTop = elementRect.top - navRect.top;
        const desiredScrollPosition = navElement.scrollTop + relativeTop - navRect.height / 2;
        navElement.scrollTo({ top: desiredScrollPosition, behavior: 'smooth' });
      }
    }, 0);

    if (item && (!item.subItems || !item.subItems.length)) {
      this._router.navigate([item.href]);
    } else {
      navItems.forEach((item) => {
        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            subItem.active = false;
          });
        }
      });
    }
  }

  activateNavSubItem(i: number, subItem: IMenuItem, sidebarItems: IMenuItem[]) {
    subItem.active = true;
    sidebarItems[i].active = true;
    sidebarItems[i].subItems?.forEach((item) => {
      if (item !== subItem) {
        item.active = false;
      }
    });
    if (subItem.href) {
      const href = this.buildHref(sidebarItems[i]?.href, subItem.href);
      this._router.navigate([href]);
    }
  }

  private buildHref(parentHref: string | undefined, childHref: string): string {
    const normalizedChild = (childHref || '').trim();
    if (!normalizedChild) {
      return parentHref || '/shift-list';
    }

    const normalizedParent = (parentHref || '').trim();
    if (!normalizedParent) {
      return normalizedChild.startsWith('/') ? normalizedChild : `/${normalizedChild}`;
    }

    const left = normalizedParent.endsWith('/') ? normalizedParent.slice(0, -1) : normalizedParent;

    if (normalizedChild.startsWith(left + '/') || normalizedChild === left) {
      return normalizedChild;
    }

    const right = normalizedChild.startsWith('/') ? normalizedChild.slice(1) : normalizedChild;
    return `${left}/${right}`;
  }

  getCurrentActiveRoute(lastSegmentOnly = true): string {
    const url = this._router.url;
    const urlSegments = url.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    return lastSegmentOnly ? lastSegment : url;
  }
}

export enum NavMode {
  Locked,
  Free,
}
