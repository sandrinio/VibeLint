import { Card } from '../ui/Card';

type Trend = 'up' | 'down' | 'flat';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: { direction: Trend; text: string };
}

const trendStyles: Record<Trend, string> = {
  up: 'text-[var(--status-pass)]',
  down: 'text-[var(--status-warn)]',
  flat: 'text-[var(--text-tertiary)]',
};

const trendArrow: Record<Trend, string> = {
  up: '\u25B2',
  down: '\u25BC',
  flat: '\u2014',
};

export function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <Card>
      <p className="text-[0.75rem] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        {value}
      </p>
      {trend && (
        <p className={`mt-1 text-[0.6875rem] font-medium ${trendStyles[trend.direction]}`}>
          {trendArrow[trend.direction]} {trend.text}
        </p>
      )}
    </Card>
  );
}
