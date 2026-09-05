import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  AnalyticsGranularity,
  IMedicineAnalyticsResponse,
  IMedicineCountEntry,
  IPrescriptionVolumeTrendResponse,
  PrescriptionTrendRangePreset,
} from '@core/interfaces/analytics/analytics.interface';
import {
  ANALYTICS_MONO_CHART_COLORS,
  buildBarChartData,
  buildLineChartData,
  buildPrescriptionTrendChartOptions,
} from '@app/shared/utils/analytics-chart.util';

function buildBarChartOptions() {
  return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
}

/**
 * The backend returns every catalog row with a count at/below the "rare" threshold — on a
 * real catalog that's the whole database and a plain 20k+ row table would balloon the DOM,
 * freeze tab switches and make the PDF export OOM the tab. Cap what we actually render.
 */
const RARELY_USED_DISPLAY_LIMIT = 50;

@Component({
  selector: 'app-medicine-prescription-tab',
  standalone: false,
  templateUrl: './medicine-prescription-tab.component.html',
  styleUrl: './medicine-prescription-tab.component.scss',
})
export class MedicinePrescriptionTabComponent implements OnChanges {
  @Input() analytics: IMedicineAnalyticsResponse | null = null;
  @Input() loading = false;

  @Input() trend: IPrescriptionVolumeTrendResponse | null = null;
  @Input() trendLoading = false;
  @Input() trendGranularity: AnalyticsGranularity = 'Day';
  /** The tab's one global date-range filter — also drives the KPI cards/tables above. */
  @Input() trendRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  /** Resolved concrete bounds of the above, for carrying the exact same period into the Medicine List navigation. */
  @Input() rangeFrom = '';
  @Input() rangeTo = '';
  @Output() trendGranularityChange = new EventEmitter<AnalyticsGranularity>();
  @Output() trendRangePresetChange = new EventEmitter<PrescriptionTrendRangePreset>();
  @Output() trendCustomRangeChange = new EventEmitter<{ from: Date; to: Date }>();

  topMedicinesChartOptions = buildBarChartOptions();
  categoryChartOptions = buildBarChartOptions();
  trendChartOptions = buildPrescriptionTrendChartOptions();

  readonly trendGranularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

  /**
   * Chart `[data]` objects, computed once per input change rather than as getters — a getter
   * is re-invoked (and returns a brand-new object) on every Angular change-detection pass, so
   * p-chart sees a "changed" input every tick and keeps re-initializing instead of settling
   * into one stable render, which can leave the canvas short of the height its container
   * actually has. See doctor-details.component.ts for the same fix applied there first.
   */
  topMedicinesChartData: ReturnType<typeof buildBarChartData> | null = null;
  categoryChartData: ReturnType<typeof buildBarChartData> | null = null;
  trendChartData: ReturnType<typeof buildLineChartData> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['analytics']) {
      this.topMedicinesChartData = this.analytics
        ? buildBarChartData(this.analytics.topPrescribedMedicines.slice(0, 10), 'Times prescribed', ANALYTICS_MONO_CHART_COLORS.primary)
        : null;
      this.categoryChartData = this.analytics
        ? buildBarChartData(
            this.analytics.categoryBreakdown.map((c) => ({ name: c.category, count: c.count })),
            'Prescriptions',
            ANALYTICS_MONO_CHART_COLORS.primary,
          )
        : null;
    }
    if (changes['trend']) {
      this.trendChartData = this.trend
        ? buildLineChartData(this.trend.points, 'Prescriptions', ANALYTICS_MONO_CHART_COLORS.primary, ANALYTICS_MONO_CHART_COLORS.areaFill)
        : null;
    }
  }

  get rarelyUsedMedicines(): IMedicineCountEntry[] | null {
    const list = this.analytics?.rarelyUsedMedicines;
    if (!list || list.length === 0) return list ?? null;
    return list.length <= RARELY_USED_DISPLAY_LIMIT ? list : list.slice(0, RARELY_USED_DISPLAY_LIMIT);
  }

  get rarelyUsedTruncated(): boolean {
    return (this.analytics?.rarelyUsedMedicines.length ?? 0) > RARELY_USED_DISPLAY_LIMIT;
  }

  readonly rarelyUsedDisplayLimit = RARELY_USED_DISPLAY_LIMIT;

  selectTrendGranularity(value: AnalyticsGranularity): void {
    if (value !== this.trendGranularity) {
      this.trendGranularityChange.emit(value);
    }
  }

  selectTrendRangePreset(value: PrescriptionTrendRangePreset): void {
    if (value !== this.trendRangePreset) {
      this.trendRangePresetChange.emit(value);
    }
  }

  formatAvg(value: number): string {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    return Number(value).toFixed(2);
  }
}
