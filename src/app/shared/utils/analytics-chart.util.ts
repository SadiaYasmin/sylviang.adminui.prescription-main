import { IHourBucket } from '@core/interfaces/doctors/doctor.interface';
import { ITrendPoint } from '@core/interfaces/analytics/analytics.interface';

/**
 * US-079: the backend does all aggregation; these are the only bit of transformation logic
 * on the frontend — reshaping already-aggregated response arrays into PrimeNG p-chart's
 * Chart.js `data` config shape. No recomputation of the underlying analytics happens here.
 * Shared between the Epic M analytics module and the doctor-details drill-down page.
 */

const CHART_COLOR = '#6366f1';
const ZERO_BAR_COLOR = '#e5e7eb';

/**
 * Monochromatic teal palette for the Analytics & Reports dashboard's charts (US-072–076).
 * Kept separate from {@link CHART_COLOR}/{@link ZERO_BAR_COLOR} above, which stay the default
 * for every caller that doesn't opt in (the doctor-details drill-down page) — this page's
 * redesign must not change that page's chart colors.
 */
export const ANALYTICS_MONO_CHART_COLORS = {
  primary: '#0d9488',
  areaFill: 'rgba(13, 148, 136, 0.12)',
  zero: '#99f6e4',
};

/**
 * `areaColor` is opt-in (default `undefined` keeps `fill: false`, matching every existing
 * caller) — passing one turns the line into a soft filled area under the trend.
 */
export function buildLineChartData(points: ITrendPoint[], label: string, color: string = CHART_COLOR, areaColor?: string) {
  return {
    labels: points.map((p) => p.bucketKey),
    datasets: [
      {
        label,
        data: points.map((p) => p.count),
        fill: !!areaColor,
        backgroundColor: areaColor,
        borderColor: color,
        tension: 0.3,
      },
    ],
  };
}

export function buildBarChartData(entries: { name: string; count: number }[], label: string, color: string = CHART_COLOR) {
  return {
    labels: entries.map((e) => e.name),
    datasets: [
      {
        label,
        data: entries.map((e) => e.count),
        backgroundColor: color,
      },
    ],
  };
}

/**
 * "Prescriptions per Doctor" horizontal bar chart: every doctor from the leaderboard is
 * plotted, including 0-prescription ones — their bar is a subtle light-gray sliver (via
 * `minBarLength` so a literal 0 stays visible on the axis instead of vanishing entirely)
 * rather than being dropped from the Y-axis.
 */
export function buildDoctorPrescriptionsChartData(
  entries: { name: string; count: number }[],
  label: string,
  color: string = CHART_COLOR,
  zeroColor: string = ZERO_BAR_COLOR,
) {
  return {
    labels: entries.map((e) => e.name),
    datasets: [
      {
        label,
        data: entries.map((e) => e.count),
        backgroundColor: entries.map((e) => (e.count === 0 ? zeroColor : color)),
        minBarLength: 3,
      },
    ],
  };
}

export function buildHourBarChartData(buckets: IHourBucket[], label: string) {
  return {
    labels: buckets.map((b) => `${b.hour}:00`),
    datasets: [
      {
        label,
        data: buckets.map((b) => b.count),
        backgroundColor: CHART_COLOR,
      },
    ],
  };
}

/**
 * Chart.js options for the 24-bucket "busiest hours" bar charts: Y axis always starts at 0
 * with whole-number ticks (a fractional "1.5 consultations" tick reads as a bug), and the
 * X axis auto-skips labels so 24 hourly ticks don't collide on typical card widths.
 */
export function buildHourBarChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { autoSkip: true, maxRotation: 0, maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };
}

/**
 * Chart.js options for horizontal ("Doctor" tab) bar charts — value axis (X, since bars run
 * sideways via indexAxis: 'y') always starts at 0 with whole-number ticks; the category axis
 * (Y) never auto-skips, since every doctor/hour label in these charts is meant to be readable.
 */
export function buildHorizontalBarChartOptions() {
  return {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#737373' },
        grid: { color: '#e5e5e5' },
      },
      y: {
        ticks: { autoSkip: false, color: '#737373' },
        grid: { display: false },
      },
    },
  };
}

function formatHourAmPm(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${period}`;
}

/**
 * Doctor-details "Busiest Consultation Hours" vertical bar chart: always all 24 hours (never
 * filtered down like {@link buildPeakHoursChartData}, since this card is small and 24 short
 * bars still fit), labeled 12 AM–11 PM and explicitly re-sorted by hour so the axis is always
 * chronological regardless of caller order. Buckets already arrive converted to Bangladesh
 * local time from the backend.
 */
export function buildHourBarChartDataAmPm(buckets: IHourBucket[], label: string) {
  const sorted = buckets.slice().sort((a, b) => a.hour - b.hour);
  return {
    labels: sorted.map((b) => formatHourAmPm(b.hour)),
    datasets: [
      {
        label,
        data: sorted.map((b) => b.count),
        backgroundColor: CHART_COLOR,
      },
    ],
  };
}

/**
 * "Peak Consultation Hours" horizontal bar chart: only hours with at least one consultation
 * are plotted (a full 24-row chart where most rows are 0 buries the actual peaks), labeled in
 * 12-hour AM/PM form since the buckets already arrive converted to Bangladesh local time.
 * Explicitly re-sorted by hour (0-23, i.e. 12 AM through 11 PM) rather than trusting caller
 * order, so the chart always reads chronologically top to bottom.
 */
export function buildPeakHoursChartData(buckets: IHourBucket[], label: string, color: string = CHART_COLOR) {
  const active = buckets
    .filter((b) => b.count > 0)
    .slice()
    .sort((a, b) => a.hour - b.hour);
  return {
    labels: active.map((b) => formatHourAmPm(b.hour)),
    datasets: [
      {
        label,
        data: active.map((b) => b.count),
        backgroundColor: color,
      },
    ],
  };
}

const DONUT_PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
const OTHERS_SEGMENT_COLOR = '#9ca3af';

/**
 * Doctor-details "Medicine Distribution" donut chart: the top `topN` medicines get their own
 * slice, everything past that is summed into a single "Others" slice so a doctor with dozens
 * of distinct medicines doesn't produce dozens of slivers. Caller entries are expected
 * pre-sorted by count descending (the backend's `allMedicines` already is), but this re-sorts
 * defensively so the split is always correct regardless of input order.
 */
export function buildMedicineDistributionChartData(entries: { name: string; count: number }[], topN = 6) {
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, topN);
  const othersTotal = sorted.slice(topN).reduce((sum, e) => sum + e.count, 0);

  const labels = top.map((e) => e.name);
  const data = top.map((e) => e.count);
  const colors = top.map((_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length]);

  if (othersTotal > 0) {
    labels.push('Others');
    data.push(othersTotal);
    colors.push(OTHERS_SEGMENT_COLOR);
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };
}

/**
 * Legend at the bottom (not the side) so the chart stays readable when the card narrows on
 * tablet/mobile — a right-side legend would squeeze the donut itself on small screens.
 */
export function buildDonutChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 10, padding: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; parsed: number }) => `${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
  };
}

/**
 * Shared by every "Prescriptions"/"Prescription Volume" trend line chart (Medicine &
 * Prescription tab, Prescription Trends tab) so they always render identically — Y axis
 * starts at 0 with whole-number ticks, tooltip states the exact count in words rather than
 * relying on Chart.js's default "datasetLabel: value" phrasing.
 */
export function buildPrescriptionTrendChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y} prescription${ctx.parsed.y === 1 ? '' : 's'}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#737373' }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0, color: '#737373' }, grid: { color: '#e5e5e5' } },
    },
  };
}
