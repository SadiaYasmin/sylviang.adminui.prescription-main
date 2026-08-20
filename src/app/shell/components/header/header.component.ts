import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbItem, BreadcrumbService } from '@core/services/breadcrumb.service';
import { AuthService } from '@core/services/auth/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];
  username = '';
  role = '';

  @Input() isSidebarExpanded = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  constructor(
    private breadcrumbService: BreadcrumbService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs$.pipe(untilDestroyed(this)).subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });

    this.authService.currentUser$.pipe(untilDestroyed(this)).subscribe((user) => {
      this.username = user?.username || '';
      this.role = user?.role || '';
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }
}
