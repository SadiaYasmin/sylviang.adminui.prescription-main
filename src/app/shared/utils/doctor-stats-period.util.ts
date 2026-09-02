import { DateTimeUtility } from '@app/@core/utils/date-time.utility';

/** Period selector for the Doctor Dashboard's "Patients Consulted"/"Finalized Prescriptions" cards — a distinct, smaller preset set from the Analytics module's Last7Days/Last30Days/Last3Months/Custom. */
export type DoctorStatsPeriod = 'Today' | 'ThisWeek' | 'ThisMonth' | 'AllTime';

export const DOCTOR_STATS_PERIOD_OPTIONS: { label: string; value: DoctorStatsPeriod }[] = [
  { label: 'Today', value: 'Today' },
  { label: 'This Week', value: 'ThisWeek' },
  { label: 'This Month', value: 'ThisMonth' },
  { label: 'All Time', value: 'AllTime' },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/** Monday of the week containing `d` — same "days since Monday" convention as the backend's `AnalyticsDateBucketing.BucketKey` week bucketing. */
function startOfWeek(d: Date): Date {
  const dayOfWeek = d.getDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addDays(startOfDay(d), -daysSinceMonday);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Resolves a {@link DoctorStatsPeriod} into concrete `from`/`to` bounds (yyyy-MM-dd, `to`
 * exclusive — the day after the last included day, matching this app's other date-range
 * resolvers). `AllTime` returns `{}` — no filter, so callers must omit both params entirely
 * rather than sending empty strings.
 */
export function resolveDoctorStatsPeriod(period: DoctorStatsPeriod): { from?: string; to?: string } {
  const today = new Date();

  switch (period) {
    case 'Today':
      return {
        from: DateTimeUtility.formatDateForAPI(startOfDay(today)),
        to: DateTimeUtility.formatDateForAPI(addDays(startOfDay(today), 1)),
      };
    case 'ThisWeek': {
      const monday = startOfWeek(today);
      return {
        from: DateTimeUtility.formatDateForAPI(monday),
        to: DateTimeUtility.formatDateForAPI(addDays(monday, 7)),
      };
    }
    case 'ThisMonth': {
      const monthStart = startOfMonth(today);
      const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      return {
        from: DateTimeUtility.formatDateForAPI(monthStart),
        to: DateTimeUtility.formatDateForAPI(nextMonthStart),
      };
    }
    case 'AllTime':
    default:
      return {};
  }
}
