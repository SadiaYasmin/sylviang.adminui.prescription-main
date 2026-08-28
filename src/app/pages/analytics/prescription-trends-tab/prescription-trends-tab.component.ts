import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  AnalyticsGranularity,
  IBusiestConsultationHoursResponse,
  IDoctorLeaderboardEntry,
  IPrescriptionVolumeTrendResponse,
  PrescriptionTrendRangePreset,
} from '@core/interfaces/analytics/analytics.interface';
import {
  buildDoctorPrescriptionsChartData,
  buildHorizontalBarChartOptions,
  buildLineChartData,
  buildPeakHoursChartData,
  buildPrescriptionTrendChartOptions,
} from '@app/shared/utils/analytics-chart.util';
import {
  PRESCRIPTION_TREND_RANGE_PRESET_LABELS,
  PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS,
} from '@app/shared/utils/prescription-trend-range.util';

/** Minimum pixel height for the horizontal bar charts below, then ~2rem per row so long lists (many doctors, many active hours) stay readable instead of being squeezed into a fixed card height. */
const MIN_CHART_HEIGHT_PX = 224;
const ROW_HEIGHT_PX = 32;

@Component({
  selector: 'app-prescription-trends-tab',
  standalone: false,
  templateUrl: './prescription-trends-tab.component.html',
  styleUrl: './prescription-trends-tab.component.scss',
})
export class PrescriptionTrendsTabComponent implements OnChanges {
  @Input() trend: IPrescriptionVolumeTrendResponse | null = null;
  @Input() granularity: AnalyticsGranularity = 'Day';
  @Input() rangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  @Input() loading = false;
  @Output() granularityChange = new EventEmitter<AnalyticsGranularity>();
  @Output() rangePresetChange = new EventEmitter<PrescriptionTrendRangePreset>();
  @Output() customRangeChange = new EventEmitter<{ from: Date; to: Date }>();

  @Input() leaderboard: IDoctorLeaderboardEntry[] | null = null;
  @Input() leaderboardLoading = false;
  @Input() busiestHours: IBusiestConsultationHoursResponse | null = null;
  @Input() busiestHoursLoading = false;

  customFrom: Date | null = null;
  customTo: Date | null = null;

  chartOptions = buildPrescriptionTrendChartOptions();
  prescriptionsPerDoctorChartOptions = buildHorizontalBarChartOptions();
  peakHoursChartOptions = buildHorizontalBarChartOptions();

  readonly granularityOptions: { label: string; value: AnalyticsGranularity }[] = [
    { label: 'Day', value: 'Day' },
    { label: 'Week', value: 'Week' },
    { label: 'Month', value: 'Month' },
  ];

  readonly rangePresetOptions = PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS;

  /**
   * Chart `[data]` objects, computed once per input change rather than as getters — a getter
   * is re-invoked (and returns a brand-new object) on every Angular change-detection pass, so
   * p-chart sees a "changed" input every tick and keeps re-initializing instead of settling
   * into one stable render. See doctor-details.component.ts for the same fix applied first.
   */
  chartData: ReturnType<typeof buildLineChartData> | null = null;
  prescriptionsPerDoctorChartData: ReturnType<typeof buildDoctorPrescriptionsChartData> | null = null;
  peakHoursChartData: ReturnType<typeof buildPeakHoursChartData> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trend']) {
      this.chartData = this.trend ? buildLineChartData(this.trend.points, 'Finalized prescriptions') : null;
    }
    if (changes['leaderboard']) {
      this.prescriptionsPerDoctorChartData =
        this.leaderboard && this.leaderboard.length > 0
          ? buildDoctorPrescriptionsChartData(
              [...this.leaderboard].sort((a, b) => b.prescriptionsCreated - a.prescriptionsCreated).map((d) => ({ name: d.fullName, count: d.prescriptionsCreated })),
              'Prescriptions created',
            )
          : null;
    }
    if (changes['busiestHours']) {
      const hours = this.busiestHours?.hours;
      const activeCount = hours?.filter((h) => h.count > 0).length ?? 0;
      this.peakHoursChartData = hours && activeCount > 0 ? buildPeakHoursChartData(hours, 'Consultations checked in (Bangladesh Time)') : null;
    }
  }

  get rangeLabel(): string {
    return PRESCRIPTION_TREND_RANGE_PRESET_LABELS[this.rangePreset];
  }

  get isCustomRange(): boolean {
    return this.rangePreset === 'Custom';
  }

  selectGranularity(value: AnalyticsGranularity): void {
    if (value !== this.granularity) {
      this.granularityChange.emit(value);
    }
  }

  selectRangePreset(value: PrescriptionTrendRangePreset): void {
    if (value !== this.rangePreset) {
      this.rangePresetChange.emit(value);
    }
  }

  onCustomRangeSelected(): void {
    if (this.customFrom && this.customTo) {
      this.customRangeChange.emit({ from: this.customFrom, to: this.customTo });
    }
  }

  get prescriptionsPerDoctorChartHeight(): string {
    return rowChartHeightPx(this.leaderboard?.length ?? 0);
  }

  get peakHoursChartHeight(): string {
    return rowChartHeightPx(this.busiestHours?.hours.filter((h) => h.count > 0).length ?? 0);
  }
}

function rowChartHeightPx(rowCount: number): string {
  return `${Math.max(MIN_CHART_HEIGHT_PX, rowCount * ROW_HEIGHT_PX)}px`;
}
