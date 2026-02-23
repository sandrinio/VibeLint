import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { RepoCard } from '../components/domain/RepoCard';
import { Button } from '../components/ui/Button';
import { fetchSetupStatus, fetchRepos } from '../lib/api';
import type { RepoResponse } from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<RepoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const status = await fetchSetupStatus();
        if (!status.completed) {
          navigate('/setup', { replace: true });
          return;
        }
        const data = await fetchRepos();
        if (!cancelled) {
          setRepos(data);
        }
      } catch {
        // If API is unavailable, stay on dashboard with empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <div className="py-12 text-center text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Your Repositories
          {repos.length > 0 && (
            <span className="ml-2 text-[0.875rem] font-normal text-[var(--text-tertiary)]">
              ({repos.length})
            </span>
          )}
        </h1>
      </div>

      {/* Empty state */}
      {repos.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--surface-primary)] py-16">
          <FolderOpen size={40} className="text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)]">No repositories connected</p>
          <Link to="/setup">
            <Button variant="primary">Go to Setup</Button>
          </Link>
        </div>
      )}

      {/* Repo grid */}
      {repos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
