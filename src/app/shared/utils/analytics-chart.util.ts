import { IHourBucket } from '@core/interfaces/doctors/doctor.interface';
import { ITrendPoint } from '@core/interfaces/analytics/analytics.interface';

/**
 * US-079: the backend does all aggregation; these are the only bit of transformation logic
 * on the frontend — reshaping already-aggregated response arrays into PrimeNG p-chart's
 * Chart.js `data` config shape. No recomputation of the underlying analytics happens here.
 * Shared between the Epic M analytics module and the doctor-details drill-down page.
 */

const CHART_COLOR = '#6366f1';

export function buildLineChartData(points: ITrendPoint[], label: string) {
  return {
    labels: points.map((p) => p.bucketKey),
    datasets: [
      {
        label,
        data: points.map((p) => p.count),
        fill: false,
        borderColor: CHART_COLOR,
        tension: 0.3,
      },
    ],
  };
}

export function buildBarChartData(entries: { name: string; count: number }[], label: string) {
  return {
    labels: entries.map((e) => e.name),
    datasets: [
      {
        label,
        data: entries.map((e) => e.count),
        backgroundColor: CHART_COLOR,
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
