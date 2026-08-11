import { Component } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';

interface IDashboardCard {
  href: string;
  title: string;
  description: string;
  icon: string;
  roles?: string[];
}

const DASHBOARD_CARDS: IDashboardCard[] = [
  {
    href: '/doctors/doctor-list',
    title: 'Doctor Management',
    description: 'Manage doctor profiles & roster',
    icon: 'fa-solid fa-user-doctor',
    roles: ['Admin'],
  },
  {
    href: '/staff/staff-list',
    title: 'Staff Management',
    description: 'Manage staff & doctor assignments',
    icon: 'fa-solid fa-users',
    roles: ['Admin', 'Doctor'],
  },
  {
    href: '/templates/template-list',
    title: 'Prescription Templates',
    description: 'Manage template layouts & branding',
    icon: 'fa-solid fa-file-medical',
    roles: ['Admin'],
  },
  {
    href: '/templates/hospital-settings',
    title: 'Hospital Settings',
    description: 'Manage hospital identity & branding',
    icon: 'fa-solid fa-hospital',
    roles: ['Admin'],
  },
];

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService) {}

  get cards(): IDashboardCard[] {
    const role = this.authService.getRole();
    return DASHBOARD_CARDS.filter((card) => !card.roles || card.roles.length === 0 || (role != null && card.roles.includes(role)));
  }
}
