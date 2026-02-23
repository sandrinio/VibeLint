import { FolderGit2, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatTime } from '../../lib/format';
import type { RepoResponse } from '../../lib/api';

interface RepoCardProps {
  repo: RepoResponse;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Card className="flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-2">
        <FolderGit2 size={16} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {repo.name}
          </h3>
          <p
            className="truncate text-[0.75rem] text-[var(--text-tertiary)]"
            title={repo.path}
          >
            {repo.path}
          </p>
        </div>
      </div>

      {/* Language badges */}
      {repo.languages.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {repo.languages.map((lang) => (
            <Badge key={lang} variant="info">{lang}</Badge>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="my-3 border-t border-[var(--border-secondary)]" />

      {/* Last scan */}
      <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)]">
        <Clock size={14} className="text-[var(--text-tertiary)]" />
        Last scan: {formatTime(repo.lastScanAt)}
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-[var(--border-secondary)]" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" disabled title="Coming in EPIC-005">
          Run Analysis
        </Button>
        <Button variant="secondary" size="sm" disabled title="Coming in EPIC-004">
          Re-inject
        </Button>
      </div>
    </Card>
  );
}
