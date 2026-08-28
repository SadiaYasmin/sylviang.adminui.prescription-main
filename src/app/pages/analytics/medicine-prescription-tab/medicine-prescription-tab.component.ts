import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  AnalyticsGranularity,
  IMedicineAnalyticsResponse,
  IPrescriptionVolumeTrendResponse,
  PrescriptionTrendRangePreset,
} from '@core/interfaces/analytics/analytics.interface';
import { buildBarChartData, buildLineChartData, buildPrescriptionTrendChartOptions } from '@app/shared/utils/analytics-chart.util';
import {
  PRESCRIPTION_TREND_RANGE_PRESET_LABELS,
  PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS,
} from '@app/shared/utils/prescription-trend-range.util';

function buildBarChartOptions() {
  return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
}

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
  @Input() trendRangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  @Output() trendGranularityChange = new EventEmitter<AnalyticsGranularity>();
  @Output() trendRangePresetChange = new EventEmitter<PrescriptionTrendRangePreset>();
  @Output() trendCustomRangeChange = new EventEmitter<{ from: Date; to: Date }>();

  customFrom: Date | null = null;
  customTo: Date | null = null;

  topMedicinesChartOptions = buildBarChartOptions();
  categoryChartOptions = buildBarChartOptions();
  trendChartOptions = buildPrescriptionTrendChartOptions();

  readonly trendGranularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

  readonly trendRangePresetOptions = PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS;

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
      this.topMedicinesChartData = this.analytics ? buildBarChartData(this.analytics.topPrescribedMedicines, 'Times prescribed') : null;
      this.categoryChartData = this.analytics
        ? buildBarChartData(
            this.analytics.categoryBreakdown.map((c) => ({ name: c.category, count: c.count })),
            'Prescriptions',
          )
        : null;
    }
    if (changes['trend']) {
      this.trendChartData = this.trend ? buildLineChartData(this.trend.points, 'Prescriptions') : null;
    }
  }

  get trendRangeLabel(): string {
    return PRESCRIPTION_TREND_RANGE_PRESET_LABELS[this.trendRangePreset];
  }

  get isCustomTrendRange(): boolean {
    return this.trendRangePreset === 'Custom';
  }

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

  onCustomRangeSelected(): void {
    if (this.customFrom && this.customTo) {
      this.trendCustomRangeChange.emit({ from: this.customFrom, to: this.customTo });
    }
  }

  formatAvg(value: number): string {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    return Number(value).toFixed(2);
  }
}
