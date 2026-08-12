import { Component, OnInit } from '@angular/core';
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
  {
    href: '/consultations/consultation-list',
    title: 'Consultations Monitor',
    description: 'Review today\'s and past consultations',
    icon: 'fa-solid fa-notes-medical',
    roles: ['Admin'],
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

  // No prescription-authoring page exists yet (Epic D), so opening a consultation
  // here just marks it InConsultation and refreshes the queue rather than navigating anywhere.
  openConsultation(item: IQueueItem): void {
    this.consultationService.openConsultation(item.consultationId).subscribe({
      next: (response) => {
        if (response && !response.hasError) {
          this.toast.success({ detail: `Opened consultation ${item.displayCode} for ${item.patientName}.` });
          this.loadTodaysQueue();
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not open this consultation.' });
        }
      },
      error: () => {
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }
}
