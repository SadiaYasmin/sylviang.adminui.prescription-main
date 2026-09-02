import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PrescriptionTrendRangePreset } from '@core/interfaces/analytics/analytics.interface';
import { PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS } from '@app/shared/utils/prescription-trend-range.util';
import { ANALYTICS_MONO_DATEPICKER_DT, ANALYTICS_MONO_SELECT_DT } from '@app/shared/utils/analytics-mono-tokens.util';

/**
 * The one date-range filter control used everywhere a "Last 7 Days / Last 30 Days / Last 3
 * Months / Custom" filter is needed (all 5 Analytics tabs, Doctor Details, Doctor Medicine
 * List) — same options, same visual treatment everywhere, so these can never drift apart.
 * Presentational only: the parent owns the preset/custom-date state and re-fetches on change.
 */
@Component({
  selector: 'app-analytics-date-range-filter',
  standalone: false,
  templateUrl: './analytics-date-range-filter.component.html',
})
export class AnalyticsDateRangeFilterComponent implements OnInit {
  @Input() preset: PrescriptionTrendRangePreset = 'Last30Days';
  @Output() presetChange = new EventEmitter<PrescriptionTrendRangePreset>();
  @Output() customRangeChange = new EventEmitter<{ from: Date; to: Date }>();

  /** Seeds the custom-date pickers once at creation — e.g. Medicine List reconstructing the exact Custom range it arrived with as navigation context. Ignored for non-Custom presets. */
  @Input() initialCustomFrom: Date | null = null;
  @Input() initialCustomTo: Date | null = null;

  /** Set by the Analytics & Reports dashboard's tabs to match its monochromatic teal palette — every other caller (Medicine List, Doctor Details) keeps the app's default primary color. */
  @Input() mono = false;
  readonly selectDt = ANALYTICS_MONO_SELECT_DT;
  readonly datepickerDt = ANALYTICS_MONO_DATEPICKER_DT;

  readonly presetOptions = PRESCRIPTION_TREND_RANGE_PRESET_OPTIONS;

  customFrom: Date | null = null;
  customTo: Date | null = null;

  ngOnInit(): void {
    this.customFrom = this.initialCustomFrom;
    this.customTo = this.initialCustomTo;
  }

  get isCustom(): boolean {
    return this.preset === 'Custom';
  }

  selectPreset(value: PrescriptionTrendRangePreset): void {
    if (value !== this.preset) {
      this.presetChange.emit(value);
    }
  }

  onCustomRangeSelected(): void {
    if (this.customFrom && this.customTo) {
      this.customRangeChange.emit({ from: this.customFrom, to: this.customTo });
    }
  }
}
