import { useState, useEffect } from 'react';
import { FileText, FolderPlus, Shield, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { fetchInjectionPreview, executeInjection } from '../../lib/api';
import type { InjectionResult } from '../../lib/api';

interface InjectPreviewModalProps {
  repoId: string;
  repoName: string;
  onClose: () => void;
  onSuccess: (result: InjectionResult) => void;
}

export function InjectPreviewModal({ repoId, repoName, onClose, onSuccess }: InjectPreviewModalProps) {
  const [preview, setPreview] = useState<InjectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [injecting, setInjecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchInjectionPreview(repoId);
        if (!cancelled) setPreview(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [repoId]);

  async function handleInject() {
    setInjecting(true);
    setError(null);
    try {
      const result = await executeInjection(repoId);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Injection failed');
      setInjecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-[560px] overflow-hidden rounded-[8px] border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] flex flex-col">
        {/* Header */}
        <div className="border-b border-[var(--border-secondary)] px-6 py-4">
          <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
            Inject into {repoName}
          </h3>
          <p className="mt-1 text-[0.8125rem] text-[var(--text-secondary)]">
            Review the files that will be written to your repo.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-[var(--text-tertiary)]">
              <Loader2 size={20} className="animate-spin" />
              <span className="ml-2 text-[0.875rem]">Loading preview...</span>
            </div>
          )}

          {error && (
            <div className="rounded-[6px] border border-[var(--status-fail)] bg-[var(--status-fail-bg)] px-4 py-3 text-[0.8125rem] text-[var(--status-fail)]">
              {error}
            </div>
          )}

          {preview && !loading && (
            <div className="space-y-4">
              {/* Files */}
              {preview.files.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                    <FileText size={14} />
                    Files ({preview.files.length})
                  </div>
                  <div className="space-y-1">
                    {preview.files.map((f) => (
                      <div
                        key={f.relativePath}
                        className="flex items-center justify-between rounded-[4px] px-2.5 py-1.5 text-[0.8125rem] bg-[var(--surface-secondary)]"
                      >
                        <span className="font-mono text-[var(--text-primary)]">{f.relativePath}</span>
                        <Badge variant={f.action === 'create' ? 'info' : 'warn'}>
                          {f.action}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Directories */}
              {preview.directories.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                    <FolderPlus size={14} />
                    Directories
                  </div>
                  <div className="space-y-1">
                    {preview.directories.map((d) => (
                      <div
                        key={d}
                        className="rounded-[4px] px-2.5 py-1.5 text-[0.8125rem] font-mono text-[var(--text-secondary)] bg-[var(--surface-secondary)]"
                      >
                        {d}/
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gitignore entries */}
              {preview.gitignoreEntries.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                    <Shield size={14} />
                    .gitignore additions
                  </div>
                  <div className="space-y-1">
                    {preview.gitignoreEntries.map((e) => (
                      <div
                        key={e}
                        className="rounded-[4px] px-2.5 py-1.5 text-[0.8125rem] font-mono text-[var(--text-secondary)] bg-[var(--surface-secondary)]"
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--border-secondary)] px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={injecting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleInject}
            disabled={loading || injecting || !!error || !preview}
          >
            {injecting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Injecting...
              </>
            ) : (
              `Inject ${preview ? preview.files.length : ''} files`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
