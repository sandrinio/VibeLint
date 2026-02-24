import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { AnalysisCheck, AnalysisCheckStatus } from '../../lib/api';

const statusIcon: Record<AnalysisCheckStatus, string> = {
  pass: '\u2713',
  warn: '\u26A0',
  fail: '\u2715',
};

const statusLabel: Record<AnalysisCheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warn',
  fail: 'Fail',
};

interface AnalysisSummaryProps {
  checks: AnalysisCheck[];
  timestamp?: string;
}

export function AnalysisSummary({ checks, timestamp }: AnalysisSummaryProps) {
  const dateStr = timestamp
    ? new Date(timestamp).toLocaleString()
    : null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
          Analysis Summary
        </h3>
        {dateStr && (
          <span className="text-[0.75rem] text-[var(--text-tertiary)]">
            {dateStr}
          </span>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-secondary)]">
            <th className="py-2 px-3 text-left text-[0.75rem] font-medium uppercase tracking-[0.03em] text-[var(--text-secondary)]">
              Check
            </th>
            <th className="py-2 px-3 text-left text-[0.75rem] font-medium uppercase tracking-[0.03em] text-[var(--text-secondary)]">
              Status
            </th>
            <th className="py-2 px-3 text-left text-[0.75rem] font-medium uppercase tracking-[0.03em] text-[var(--text-secondary)]">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => (
            <tr
              key={check.name}
              className="border-b border-[var(--border-secondary)] transition-colors duration-100 hover:bg-[var(--surface-hover)]"
            >
              <td className="py-2 px-3 text-[0.875rem] text-[var(--text-primary)]">
                {check.name}
              </td>
              <td className="py-2 px-3">
                <Badge variant={check.status}>
                  {statusIcon[check.status]} {statusLabel[check.status]}
                </Badge>
              </td>
              <td className="py-2 px-3 text-[0.875rem] text-[var(--text-secondary)]">
                {check.summary}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
