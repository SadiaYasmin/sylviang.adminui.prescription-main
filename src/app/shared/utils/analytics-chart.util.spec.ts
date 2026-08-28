import {
  buildBarChartData,
  buildDoctorPrescriptionsChartData,
  buildHorizontalBarChartOptions,
  buildHourBarChartData,
  buildHourBarChartDataAmPm,
  buildHourBarChartOptions,
  buildLineChartData,
  buildPeakHoursChartData,
} from './analytics-chart.util';

describe('analytics-chart.util', () => {
  it('buildLineChartData should map trend points to labels/data arrays in order', () => {
    const result = buildLineChartData(
      [
        { bucketKey: '2026-01-01', count: 3 },
        { bucketKey: '2026-01-02', count: 5 },
      ],
      'My Series',
    );

    expect(result.labels).toEqual(['2026-01-01', '2026-01-02']);
    expect(result.datasets[0].data).toEqual([3, 5]);
    expect(result.datasets[0].label).toBe('My Series');
  });

  it('buildBarChartData should map name/count entries to labels/data arrays in order', () => {
    const result = buildBarChartData(
      [
        { name: 'Napa', count: 10 },
        { name: 'Seclo', count: 4 },
      ],
      'Times Prescribed',
    );

    expect(result.labels).toEqual(['Napa', 'Seclo']);
    expect(result.datasets[0].data).toEqual([10, 4]);
  });

  it('buildDoctorPrescriptionsChartData should keep every doctor, including 0-prescription ones, and color zero bars separately', () => {
    const entries = [
      { name: 'Dr. Jane', count: 7 },
      { name: 'Dr. Idle', count: 0 },
    ];

    const result = buildDoctorPrescriptionsChartData(entries, 'Prescriptions created');

    expect(result.labels).toEqual(['Dr. Jane', 'Dr. Idle']);
    expect(result.datasets[0].data).toEqual([7, 0]);
    expect(result.datasets[0].backgroundColor[0]).toBe('#6366f1');
    expect(result.datasets[0].backgroundColor[1]).toBe('#e5e7eb');
    expect(result.datasets[0].minBarLength).toBeGreaterThan(0);
  });

  it('buildHourBarChartData should render every hour as an "H:00" label, zero-filled hours included', () => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: hour === 9 ? 3 : 0 }));

    const result = buildHourBarChartData(buckets, 'Consultations');

    expect(result.labels?.length).toBe(24);
    expect(result.labels?.[9]).toBe('9:00');
    expect(result.datasets[0].data[9]).toBe(3);
    expect(result.datasets[0].data[0]).toBe(0);
  });

  it('buildHourBarChartOptions should start the Y axis at 0 with whole-number ticks and decluttered X labels', () => {
    const options = buildHourBarChartOptions();
    expect(options.scales.y.beginAtZero).toBeTrue();
    expect(options.scales.y.ticks.precision).toBe(0);
    expect(options.scales.x.ticks.autoSkip).toBeTrue();
  });

  it('buildHourBarChartOptions should return a fresh object on every call', () => {
    expect(buildHourBarChartOptions()).not.toBe(buildHourBarChartOptions());
  });

  it('buildPeakHoursChartData should drop zero-count hours and label the rest in 12-hour AM/PM form', () => {
    const buckets = [
      { hour: 0, count: 1 },
      { hour: 9, count: 0 },
      { hour: 12, count: 3 },
      { hour: 13, count: 2 },
      { hour: 23, count: 5 },
    ];

    const result = buildPeakHoursChartData(buckets, 'Consultations');

    expect(result.labels).toEqual(['12:00 AM', '12:00 PM', '1:00 PM', '11:00 PM']);
    expect(result.datasets[0].data).toEqual([1, 3, 2, 5]);
  });

  it('buildPeakHoursChartData should sort chronologically by hour regardless of input order', () => {
    const buckets = [
      { hour: 23, count: 5 },
      { hour: 0, count: 1 },
      { hour: 13, count: 2 },
      { hour: 12, count: 3 },
    ];

    const result = buildPeakHoursChartData(buckets, 'Consultations');

    expect(result.labels).toEqual(['12:00 AM', '12:00 PM', '1:00 PM', '11:00 PM']);
    expect(result.datasets[0].data).toEqual([1, 3, 2, 5]);
  });

  it('buildPeakHoursChartData should return empty series when every hour is zero', () => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

    const result = buildPeakHoursChartData(buckets, 'Consultations');

    expect(result.labels).toEqual([]);
    expect(result.datasets[0].data).toEqual([]);
  });

  it('buildHourBarChartDataAmPm should render all 24 hours, chronologically, in 12-hour AM/PM form', () => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: hour === 0 ? 1 : hour === 13 ? 2 : 0 })).reverse();

    const result = buildHourBarChartDataAmPm(buckets, 'Consultations');

    expect(result.labels?.length).toBe(24);
    expect(result.labels?.[0]).toBe('12:00 AM');
    expect(result.labels?.[13]).toBe('1:00 PM');
    expect(result.datasets[0].data[0]).toBe(1);
    expect(result.datasets[0].data[13]).toBe(2);
    expect(result.datasets[0].data[9]).toBe(0);
  });

  it('buildHorizontalBarChartOptions should render sideways with a zero-based whole-number value axis and no skipped category labels', () => {
    const options = buildHorizontalBarChartOptions();
    expect(options.indexAxis).toBe('y');
    expect(options.scales.x.beginAtZero).toBeTrue();
    expect(options.scales.x.ticks.precision).toBe(0);
    expect(options.scales.y.ticks.autoSkip).toBeFalse();
  });

  it('buildHorizontalBarChartOptions should return a fresh object on every call', () => {
    expect(buildHorizontalBarChartOptions()).not.toBe(buildHorizontalBarChartOptions());
  });
});
