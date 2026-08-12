import { IMenuItem } from '../interfaces/menuResponse.interface';

export const webSidebarMenuItems: IMenuItem[] = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    active: false,
    icon: 'fa-solid fa-chart-line',
  },
  {
    href: '/patients/patient-list',
    title: 'Patients',
    active: false,
    icon: 'fa-solid fa-user-injured',
    roles: ['Admin', 'Doctor', 'Staff'],
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
    href: '/consultations/consultation-list',
    title: 'Consultations',
    active: false,
    icon: 'fa-solid fa-notes-medical',
    roles: ['Admin'],
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
