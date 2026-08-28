import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
import { PrescriptionTrendRangePreset } from '@core/interfaces/analytics/analytics.interface';

/**
 * Single source of truth for the preset dropdown's options/labels — every "Prescriptions"
 * trend chart (Medicine & Prescription tab, Prescription Trends tab) imports this instead of
 * declaring its own copy, so the two charts' filters can never drift out of sync with
 * each other.
 */
export const PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS: { label: string; value: PrescriptionTrendRangePreset }[] = [
  { label: 'Last 7 Days', value: 'Last7Days' },
  { label: 'Last 30 Days', value: 'Last30Days' },
  { label: 'Last 3 Months', value: 'Last3Months' },
  { label: 'Custom', value: 'Custom' },
];

export const PRESCRIPTION_TREND_RANGE_PRESET_LABELS: Record<PrescriptionTrendRangePreset, string> = {
  Last7Days: 'Last 7 Days',
  Last30Days: 'Last 30 Days',
  Last3Months: 'Last 3 Months',
  Custom: 'Custom Range',
};

function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(base: Date, months: number): Date {
  const result = new Date(base);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Translates a "Prescriptions" trend range preset into the `from`/`to` query bounds the
 * `prescription-trend` endpoint expects (yyyy-MM-dd, via {@link DateTimeUtility.formatDateForAPI}).
 * `to` is always the day *after* the last included day — the backend's upper bound is
 * inclusive of the whole calendar day, so a prescription finalized any time today must not
 * be excluded by a `to` that lands at today's midnight.
 */
export function resolvePrescriptionTrendRange(
  preset: PrescriptionTrendRangePreset,
  customFrom: Date | null,
  customTo: Date | null,
): { from: string; to: string } {
  const today = new Date();

  switch (preset) {
    case 'Last7Days':
      return {
        from: DateTimeUtility.formatDateForAPI(addDays(today, -6)),
        to: DateTimeUtility.formatDateForAPI(addDays(today, 1)),
      };
    case 'Last3Months':
      return {
        from: DateTimeUtility.formatDateForAPI(addMonths(today, -3)),
        to: DateTimeUtility.formatDateForAPI(addDays(today, 1)),
      };
    case 'Custom':
      return {
        from: DateTimeUtility.formatDateForAPI(customFrom ?? addDays(today, -29)),
        to: DateTimeUtility.formatDateForAPI(addDays(customTo ?? today, 1)),
      };
    case 'Last30Days':
    default:
      return {
        from: DateTimeUtility.formatDateForAPI(addDays(today, -29)),
        to: DateTimeUtility.formatDateForAPI(addDays(today, 1)),
      };
  }
}
