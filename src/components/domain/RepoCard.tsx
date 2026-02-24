import { FolderGit2, Clock, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatTime } from '../../lib/format';
import type { RepoResponse } from '../../lib/api';

interface RepoCardProps {
  repo: RepoResponse;
  injectedAt?: string | null;
  onInject?: () => void;
}

export function RepoCard({ repo, injectedAt, onInject }: RepoCardProps) {
  const navigate = useNavigate();

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

      {/* Timestamps */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)]">
          <Clock size={14} className="text-[var(--text-tertiary)]" />
          Last scan: {formatTime(repo.lastScanAt)}
        </div>
        {injectedAt && (
          <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)]">
            <Download size={14} className="text-[var(--text-tertiary)]" />
            Injected: {formatTime(injectedAt)}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-[var(--border-secondary)]" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => navigate('/analysis')}>
          Run Analysis
        </Button>
        <Button variant="secondary" size="sm" onClick={onInject}>
          {injectedAt ? 'Re-inject' : 'Inject'}
        </Button>
      </div>
    </Card>
  );
}
