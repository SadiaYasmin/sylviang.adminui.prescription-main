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
    href: '/medicines/medicine-list',
    title: 'Medicines',
    active: false,
    icon: 'fa-solid fa-pills',
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
    roles: ['Admin'],
  },
  {
    href: '/staff/staff-list',
    title: 'Your Assigned Staff',
    active: false,
    icon: 'fa-solid fa-users',
    roles: ['Doctor'],
  },
  {
    title: 'Prescriptions',
    active: false,
    icon: 'fa-solid fa-file-prescription',
    roles: ['Doctor'],
    subItems: [
      {
        href: '/prescriptions',
        title: 'Start a Prescription',
        active: false,
        icon: 'fa-solid fa-file-pen',
      },
      {
        href: '/prescriptions/drafts',
        title: 'Draft Prescriptions',
        active: false,
        icon: 'fa-solid fa-file-circle-question',
      },
      {
        href: '/prescriptions/finalized',
        title: 'Finalized Prescriptions',
        active: false,
        icon: 'fa-solid fa-file-circle-check',
      },
      {
        href: '/prescriptions/preferences',
        title: 'Prescription Preferences',
        active: false,
        icon: 'fa-solid fa-gear',
      },
      {
        href: '/quick-add/medicine',
        title: 'Quick Add Presets',
        active: false,
        icon: 'fa-solid fa-bolt',
      },
    ],
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
