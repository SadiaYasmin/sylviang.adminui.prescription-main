import { QuickAddSectionType } from '@core/interfaces/quick-add/quick-add.interface';

export interface IQuickAddSectionOption {
  sectionType: QuickAddSectionType;
  routeSegment: string;
  label: string;
  icon: string;
  /** Drives which fields manage-quick-add-preset renders for this section's payload. */
  payloadShape: 'medicine' | 'diagnosis' | 'text' | 'bilingual';
  /** Singular, e.g. "Medicine" — used in "Add {Medicine} Preset" and the manage-form heading. */
  singularLabel: string;
  /** Plural noun for the count/search copy, e.g. "8 {medicines} configured" / "Search {medicines}...". */
  countNoun: string;
}

export const QUICK_ADD_SECTION_OPTIONS: IQuickAddSectionOption[] = [
  {
    sectionType: 'Medicine',
    routeSegment: 'medicine',
    label: 'Quick Add Medicines',
    icon: 'fa-solid fa-pills',
    payloadShape: 'medicine',
    singularLabel: 'Medicine',
    countNoun: 'medicines',
  },
  {
    sectionType: 'Diagnosis',
    routeSegment: 'diagnosis',
    label: 'Quick Add Diagnoses',
    icon: 'fa-solid fa-stethoscope',
    payloadShape: 'diagnosis',
    singularLabel: 'Diagnosis',
    countNoun: 'diagnoses',
  },
  {
    sectionType: 'Investigation',
    routeSegment: 'investigation',
    label: 'Quick Add Investigations',
    icon: 'fa-solid fa-vial',
    payloadShape: 'text',
    singularLabel: 'Investigation',
    countNoun: 'investigations',
  },
  {
    sectionType: 'Advice',
    routeSegment: 'advice',
    label: 'Quick Add Advice',
    icon: 'fa-solid fa-comment-medical',
    payloadShape: 'bilingual',
    singularLabel: 'Advice',
    countNoun: 'advice',
  },
  {
    sectionType: 'FollowUp',
    routeSegment: 'follow-up',
    label: 'Quick Add Follow-Up',
    icon: 'fa-solid fa-calendar-check',
    payloadShape: 'bilingual',
    singularLabel: 'Follow-Up',
    countNoun: 'follow-ups',
  },
];

export function findQuickAddSectionByRoute(routeSegment: string): IQuickAddSectionOption {
  const found = QUICK_ADD_SECTION_OPTIONS.find((o) => o.routeSegment === routeSegment);
  if (!found) throw new Error(`Unknown Quick Add section route: ${routeSegment}`);
  return found;
}
