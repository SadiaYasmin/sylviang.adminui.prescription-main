import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  title: string;
  icon: string;
  href: string;
  active: boolean;
  isClickable?: boolean;
  showIconOnly?: boolean;
  tooltip?: string;
}

export interface BreadcrumbConfig {
  title: string;
  icon?: string;
  href?: string;
  isClickable?: boolean;
  showIconOnly?: boolean;
  tooltip?: string;
  parent?: BreadcrumbConfig;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  private customBreadcrumbs: Map<string, BreadcrumbConfig[]> = new Map();

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbs();
    });
    this.updateBreadcrumbs();
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbConfig[]): void {
    this.customBreadcrumbs.set(this.currentPath(), breadcrumbs);
    this.updateBreadcrumbs();
  }

  clearBreadcrumbs(): void {
    this.customBreadcrumbs.delete(this.currentPath());
    this.updateBreadcrumbs();
  }

  // Strip query string/fragment so a route like /analytics?tab=medicines still keys off
  // /analytics — otherwise a page whose query param changes after setBreadcrumbs() ran in
  // ngOnInit (e.g. a tab param) loses its custom breadcrumb lookup and falls back to the
  // raw-route auto-generated one, which also used to render the query string as crumb text.
  private currentPath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }

  private updateBreadcrumbs(): void {
    const currentUrl = this.currentPath();
    const customBreadcrumbs = this.customBreadcrumbs.get(currentUrl);

    if (customBreadcrumbs && customBreadcrumbs.length > 0) {
      this.breadcrumbsSubject.next(this.convertToBreadcrumbItems(customBreadcrumbs));
    } else {
      this.breadcrumbsSubject.next(this.createBreadcrumbsFromRoute());
    }
  }

  private convertToBreadcrumbItems(configs: BreadcrumbConfig[]): BreadcrumbItem[] {
    return configs.map((config, index) => ({
      title: config.title,
      icon: config.icon || 'fa-solid fa-file',
      href: config.isClickable !== false ? config.href || '#' : '',
      active: index === configs.length - 1,
      isClickable: config.isClickable !== false,
      showIconOnly: config.showIconOnly || false,
      tooltip: config.tooltip || config.title,
    }));
  }

  private createBreadcrumbsFromRoute(): BreadcrumbItem[] {
    const url = this.currentPath();
    const urlSegments = url.split('/').filter((segment) => segment);

    if (urlSegments.length === 0) {
      return [{ title: 'Dashboard', icon: 'fas fa-chart-line', href: '/dashboard', active: true, isClickable: true }];
    }

    const sectionIcons: Record<string, string> = {
      dashboard: 'fa-solid fa-chart-line',
      analytics: 'fa-solid fa-chart-pie',
      'my-profile': 'fa-solid fa-user',
      patients: 'fa-solid fa-user-injured',
      'patient-list': 'fa-solid fa-list',
      'assigned-doctors': 'fa-solid fa-user-doctor',
      assigned: 'fa-solid fa-user-doctor',
      medicines: 'fa-solid fa-pills',
      'medicine-list': 'fa-solid fa-pills',
      doctors: 'fa-solid fa-user-doctor',
      'doctor-list': 'fa-solid fa-user-doctor',
      'doctor-details': 'fa-solid fa-eye',
      staff: 'fa-solid fa-users',
      'staff-list': 'fa-solid fa-users',
      departments: 'fa-solid fa-building',
      prescriptions: 'fa-solid fa-file-prescription',
      templates: 'fa-solid fa-file-medical',
      'template-list': 'fa-solid fa-list',
      'hospital-settings': 'fa-solid fa-hospital',
      'manage-template': 'fa-solid fa-pen-to-square',
      'manage-medicine': 'fa-solid fa-pen-to-square',
      'manage-doctor': 'fa-solid fa-pen-to-square',
      'manage-patient': 'fa-solid fa-pen-to-square',
      'manage-staff': 'fa-solid fa-pen-to-square',
      'manage-shift': 'fa-solid fa-pen-to-square',
      'manage-payroll-head': 'fa-solid fa-pen-to-square',
      'manage-quick-add-preset': 'fa-solid fa-pen-to-square',
      consultations: 'fa-solid fa-notes-medical',
      'consultation-list': 'fa-solid fa-notes-medical',
      attendance: 'fa-solid fa-clock',
      'shift-list': 'fa-solid fa-list',
      payroll: 'fa-solid fa-money-bill-wave',
      'payroll-head-list': 'fa-solid fa-list',
      'quick-add': 'fa-solid fa-bolt',
      medicine: 'fa-solid fa-pills',
      diagnosis: 'fa-solid fa-stethoscope',
      investigation: 'fa-solid fa-vial',
      advice: 'fa-solid fa-comment-medical',
      'follow-up': 'fa-solid fa-calendar-check',
      drafts: 'fa-solid fa-file-circle-question',
      finalized: 'fa-solid fa-file-circle-check',
      preferences: 'fa-solid fa-gear',
      view: 'fa-solid fa-eye',
      authoring: 'fa-solid fa-file-pen',
    };

    const crumbs: BreadcrumbItem[] = [];
    let pathAccumulator = '';

    for (let i = 0; i < urlSegments.length; i++) {
      const segment = urlSegments[i];
      pathAccumulator += `/${segment}`;
      const isLast = i === urlSegments.length - 1;
      crumbs.push({
        title: this.formatSegmentName(segment),
        icon: sectionIcons[segment] || 'fa-solid fa-file',
        href: pathAccumulator,
        active: isLast,
        isClickable: !isLast,
      });
    }

    return crumbs;
  }

  private formatSegmentName(segment: string): string {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public getBreadcrumbs(): BreadcrumbItem[] {
    return this.breadcrumbsSubject.value;
  }
}
