import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

type Status = 'pass' | 'warn' | 'fail';

interface AnalysisRow {
  check: string;
  status: Status;
  details: string;
}

const statusIcon: Record<Status, string> = {
  pass: '\u2713',
  warn: '\u26A0',
  fail: '\u2715',
};

const statusLabel: Record<Status, string> = {
  pass: 'Pass',
  warn: 'Warn',
  fail: 'Fail',
};

const rows: AnalysisRow[] = [
  { check: 'Complexity', status: 'warn', details: '+8 in auth.ts' },
  { check: 'Duplicates', status: 'fail', details: '3 clones (>10 lines)' },
  { check: 'Error handling', status: 'warn', details: '2 empty catch blocks' },
  { check: 'New dependencies', status: 'pass', details: 'None' },
  { check: 'File size', status: 'warn', details: 'auth.ts 482 lines' },
  { check: 'Coupling', status: 'pass', details: '4 dirs, 12 files' },
];

export function AnalysisSummary() {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
          Latest analysis
        </h3>
        <span className="text-[0.75rem] text-[var(--text-tertiary)]">
          feature/auth vs main
        </span>
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
          {rows.map((row) => (
            <tr
              key={row.check}
              className="border-b border-[var(--border-secondary)] transition-colors duration-100 hover:bg-[var(--surface-hover)]"
            >
              <td className="py-2 px-3 text-[0.875rem] text-[var(--text-primary)]">
                {row.check}
              </td>
              <td className="py-2 px-3">
                <Badge variant={row.status}>
                  {statusIcon[row.status]} {statusLabel[row.status]}
                </Badge>
              </td>
              <td className="py-2 px-3 text-[0.875rem] text-[var(--text-secondary)]">
                {row.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
