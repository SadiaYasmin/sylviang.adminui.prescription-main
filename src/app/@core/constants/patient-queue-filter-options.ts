import { PatientQueueFilter } from '@core/interfaces/patients/patient.interface';

export interface IPatientQueueFilterOption {
  label: string;
  value: PatientQueueFilter;
}

export const PatientQueueFilterOptions: IPatientQueueFilterOption[] = [
  { label: "Today's Consultation Queue", value: 'TodayQueue' },
  { label: 'All Registered Patients', value: 'AllRegistered' },
  { label: 'Not Consulted Today', value: 'NotConsultedToday' },
  { label: 'Completed Today', value: 'CompletedToday' },
];

export const DefaultPatientQueueFilter: PatientQueueFilter = 'TodayQueue';
