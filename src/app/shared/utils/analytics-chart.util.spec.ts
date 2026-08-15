import { buildBarChartData, buildHourBarChartData, buildLineChartData } from './analytics-chart.util';

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

  it('buildHourBarChartData should render every hour as an "H:00" label, zero-filled hours included', () => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: hour === 9 ? 3 : 0 }));

    const result = buildHourBarChartData(buckets, 'Consultations');

    expect(result.labels?.length).toBe(24);
    expect(result.labels?.[9]).toBe('9:00');
    expect(result.datasets[0].data[9]).toBe(3);
    expect(result.datasets[0].data[0]).toBe(0);
  });
});
