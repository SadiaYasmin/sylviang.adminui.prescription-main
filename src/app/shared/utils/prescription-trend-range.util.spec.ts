import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
import { resolvePrescriptionTrendRange } from './prescription-trend-range.util';

describe('prescription-trend-range.util', () => {
  it('Last30Days should span the trailing 30 calendar days up to and including today', () => {
    const today = new Date();
    const expectedFrom = new Date(today);
    expectedFrom.setDate(expectedFrom.getDate() - 29);
    const expectedTo = new Date(today);
    expectedTo.setDate(expectedTo.getDate() + 1);

    const result = resolvePrescriptionTrendRange('Last30Days', null, null);

    expect(result.from).toBe(DateTimeUtility.formatDateForAPI(expectedFrom));
    expect(result.to).toBe(DateTimeUtility.formatDateForAPI(expectedTo));
  });

  it('Last7Days should span the trailing 7 calendar days', () => {
    const today = new Date();
    const expectedFrom = new Date(today);
    expectedFrom.setDate(expectedFrom.getDate() - 6);

    const result = resolvePrescriptionTrendRange('Last7Days', null, null);

    expect(result.from).toBe(DateTimeUtility.formatDateForAPI(expectedFrom));
  });

  it('Custom should use the given from/to, with `to` shifted one day later to stay inclusive', () => {
    const from = new Date(2026, 0, 10);
    const to = new Date(2026, 0, 20);

    const result = resolvePrescriptionTrendRange('Custom', from, to);

    expect(result.from).toBe('2026-01-10');
    expect(result.to).toBe('2026-01-21');
  });

  it('Custom with no dates picked yet should fall back to a trailing 30-day window rather than throwing', () => {
    const result = resolvePrescriptionTrendRange('Custom', null, null);

    expect(result.from).toBeTruthy();
    expect(result.to).toBeTruthy();
  });
});
