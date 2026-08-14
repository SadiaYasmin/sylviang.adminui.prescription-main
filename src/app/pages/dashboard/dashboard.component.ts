import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IQueueItem } from '@core/interfaces/consultations/consultation.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { ToastService } from '@core/services/misc/toast.service';

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
    roles: ['Admin'],
  },
  {
    href: '/staff/staff-list',
    title: 'Your Assigned Staff',
    description: 'View staff assigned to you',
    icon: 'fa-solid fa-users',
    roles: ['Doctor'],
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
  {
    href: '/consultations/consultation-list',
    title: 'Consultations Monitor',
    description: 'Review today\'s and past consultations',
    icon: 'fa-solid fa-notes-medical',
    roles: ['Admin'],
  },
  {
    href: '/prescriptions',
    title: 'Start a Prescription',
    description: 'Quick-create for a walk-in patient',
    icon: 'fa-solid fa-file-pen',
    roles: ['Doctor'],
  },
  {
    href: '/prescriptions/drafts',
    title: 'Draft Prescriptions',
    description: 'Resume your in-progress prescriptions',
    icon: 'fa-solid fa-file-circle-question',
    roles: ['Doctor'],
  },
  {
    href: '/prescriptions/finalized',
    title: 'Finalized Prescriptions',
    description: 'Review your completed prescriptions',
    icon: 'fa-solid fa-file-circle-check',
    roles: ['Doctor'],
  },
  {
    href: '/prescriptions/preferences',
    title: 'Prescription Preferences',
    description: 'Set your preferred template & signature',
    icon: 'fa-solid fa-gear',
    roles: ['Doctor'],
  },
];

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  currentYear = new Date().getFullYear();
  role: string | null;

  queue: IQueueItem[] = [];
  queueLoading = false;

  constructor(
    private authService: AuthService,
    private consultationService: ConsultationService,
    private toast: ToastService,
    private router: Router,
  ) {
    this.role = this.authService.getRole();
  }

  get cards(): IDashboardCard[] {
    return DASHBOARD_CARDS.filter((card) => !card.roles || card.roles.length === 0 || (this.role != null && card.roles.includes(this.role)));
  }

  get isDoctor(): boolean {
    return this.role === 'Doctor';
  }

  get isStaff(): boolean {
    return this.role === 'Staff';
  }

  ngOnInit(): void {
    if (this.isDoctor) {
      this.loadTodaysQueue();
    } else if (this.isStaff) {
      this.loadMyQueue();
    }
  }

  loadTodaysQueue(): void {
    this.queueLoading = true;
    this.consultationService.getTodaysQueue().subscribe({
      next: (response) => {
        this.queue = !response.hasError && response.content ? response.content : [];
        this.queueLoading = false;
      },
      error: () => {
        this.queue = [];
        this.queueLoading = false;
      },
    });
  }

  loadMyQueue(): void {
    this.queueLoading = true;
    this.consultationService.getMyQueue().subscribe({
      next: (response) => {
        this.queue = !response.hasError && response.content ? response.content : [];
        this.queueLoading = false;
      },
      error: () => {
        this.queue = [];
        this.queueLoading = false;
      },
    });
  }

  displayStatus(status: string): string {
    return status === 'InConsultation' ? 'In Progress' : status;
  }

  // Opening a consultation now lands directly in prescription authoring (Epic D) — the
  // Waiting -> InConsultation transition happens there (StartOrResumePrescriptionHandler),
  // not here, so there's no separate "open" call before navigating.
  openConsultation(item: IQueueItem): void {
    this.router.navigate(['/prescriptions'], { queryParams: { consultationId: item.consultationId } });
  }
}
