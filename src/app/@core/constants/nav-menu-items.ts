import { IMenuItem } from '../interfaces/menuResponse.interface';

export const webSidebarMenuItems: IMenuItem[] = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    active: false,
    icon: 'fa-solid fa-chart-line',
  },
  {
    href: '/doctors/doctor-list',
    title: 'Doctor Management',
    active: false,
    icon: 'fa-solid fa-user-doctor',
    roles: ['Admin'],
  },
  {
    href: '/staff/staff-list',
    title: 'Staff Management',
    active: false,
    icon: 'fa-solid fa-users',
    roles: ['Admin', 'Doctor'],
  },
  {
    title: 'Prescription Templates',
    active: false,
    icon: 'fa-solid fa-file-medical',
    roles: ['Admin'],
    subItems: [
      {
        href: '/templates/template-list',
        title: 'Template List',
        active: false,
        icon: 'fa-solid fa-list',
      },
      {
        href: '/templates/hospital-settings',
        title: 'Hospital Settings',
        active: false,
        icon: 'fa-solid fa-hospital',
      },
    ],
  },
];
