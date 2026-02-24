import { useState, useEffect, useCallback } from 'react';
import { Loader2, Play, FileSearch } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ToastContainer } from '../components/ui/Toast';
import type { ToastData } from '../components/ui/Toast';
import { MetricCard } from '../components/domain/MetricCard';
import { AnalysisSummary } from '../components/domain/AnalysisSummary';
import { fetchRepos, runAnalysis } from '../lib/api';
import type { RepoResponse, AnalysisReport, AnalysisCheckStatus } from '../lib/api';

let toastId = 0;

export default function AnalysisView() {
  const [repos, setRepos] = useState<RepoResponse[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: ++toastId, message, type }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    fetchRepos()
      .then((data) => {
        setRepos(data);
        if (data.length > 0) setSelectedRepoId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRunAnalysis() {
    if (!selectedRepoId) return;
    setAnalyzing(true);
    setReport(null);
    try {
      const result = await runAnalysis(selectedRepoId);
      setReport(result);
      addToast('Analysis complete', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <div className="py-12 text-center text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  const failCount = report?.checks.filter((c) => c.status === 'fail').length ?? 0;
  const warnCount = report?.checks.filter((c) => c.status === 'warn').length ?? 0;
  const passCount = report?.checks.filter((c) => c.status === 'pass').length ?? 0;

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Analysis
        </h1>
        <div className="flex items-center gap-3">
          {repos.length > 1 && (
            <select
              className="h-8 rounded-[6px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 text-[0.875rem] text-[var(--text-primary)]"
              value={selectedRepoId ?? ''}
              onChange={(e) => { setSelectedRepoId(e.target.value); setReport(null); }}
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <Button variant="primary" onClick={handleRunAnalysis} disabled={analyzing || !selectedRepoId}>
            {analyzing ? (
              <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Play size={14} /> Run Analysis</>
            )}
          </Button>
        </div>
      </div>

      {/* No report yet */}
      {!report && !analyzing && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--surface-primary)] py-16">
          <FileSearch size={40} className="text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)]">No analysis results yet</p>
          <p className="text-[0.8125rem] text-[var(--text-tertiary)]">
            Click "Run Analysis" to scan your repo for code quality issues.
          </p>
        </div>
      )}

      {/* Analyzing spinner */}
      {analyzing && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--surface-primary)] py-16">
          <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
          <p className="text-[var(--text-secondary)]">Running analysis...</p>
          <p className="text-[0.8125rem] text-[var(--text-tertiary)]">
            Checking complexity, duplication, error patterns, and more.
          </p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Source Files" value={String(report.totalFiles)} />
            <MetricCard
              label="Passing"
              value={String(passCount)}
              trend={passCount === report.checks.length ? { direction: 'up', text: 'All clear' } : undefined}
            />
            <MetricCard
              label="Warnings"
              value={String(warnCount)}
              trend={warnCount > 0 ? { direction: 'down', text: `${warnCount} check(s)` } : undefined}
            />
            <MetricCard
              label="Failures"
              value={String(failCount)}
              trend={failCount > 0 ? { direction: 'down', text: `${failCount} check(s)` } : undefined}
            />
          </div>

          {/* Languages */}
          {report.languageSummary.length > 0 && (
            <Card>
              <h3 className="mb-2 text-[0.875rem] font-semibold text-[var(--text-primary)]">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {report.languageSummary.map((l) => (
                  <Badge key={l.language} variant="info">{l.language} ({l.fileCount})</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Summary table */}
          <AnalysisSummary checks={report.checks} timestamp={report.timestamp} />

          {/* Detail sections */}
          {report.fileSize.issues.length > 0 && (
            <DetailSection title="File Size Issues" status={report.fileSize.status}>
              {report.fileSize.issues.slice(0, 15).map((i) => (
                <DetailRow key={i.relativePath} status={i.status}>
                  <span className="font-mono text-[0.8125rem]">{i.relativePath}</span>
                  <span className="text-[var(--text-tertiary)]">{i.lines} lines</span>
                </DetailRow>
              ))}
            </DetailSection>
          )}

          {report.functionSize.issues.length > 0 && (
            <DetailSection title="Long Functions" status={report.functionSize.status}>
              {report.functionSize.issues.slice(0, 15).map((i, idx) => (
                <DetailRow key={`${i.relativePath}:${i.functionName}:${idx}`} status={i.status}>
                  <span className="font-mono text-[0.8125rem]">{i.functionName}</span>
                  <span className="text-[var(--text-tertiary)]">{i.relativePath}:{i.lineNumber} — {i.lines} lines</span>
                </DetailRow>
              ))}
            </DetailSection>
          )}

          {report.errorPatterns.issues.length > 0 && (
            <DetailSection title="Error Handling Issues" status={report.errorPatterns.status}>
              {report.errorPatterns.issues.slice(0, 15).map((i, idx) => (
                <DetailRow key={`${i.relativePath}:${i.lineNumber}:${idx}`} status="warn">
                  <span className="font-mono text-[0.8125rem]">{i.pattern}</span>
                  <span className="text-[var(--text-tertiary)]">{i.relativePath}:{i.lineNumber}</span>
                </DetailRow>
              ))}
            </DetailSection>
          )}

          {report.complexity.issues.length > 0 && (
            <DetailSection title="Complexity Hotspots" status={report.complexity.status}>
              {report.complexity.issues.slice(0, 15).map((i, idx) => (
                <DetailRow key={`${i.relativePath}:${i.functionName}:${idx}`} status={i.status}>
                  <span className="font-mono text-[0.8125rem]">{i.functionName} (complexity: {i.complexity})</span>
                  <span className="text-[var(--text-tertiary)]">{i.relativePath}:{i.lineNumber}</span>
                </DetailRow>
              ))}
            </DetailSection>
          )}

          {report.dependencies.newDeps.length > 0 && (
            <DetailSection title="New Dependencies" status={report.dependencies.status}>
              {report.dependencies.newDeps.map((d) => (
                <DetailRow key={d.name} status="pass">
                  <span className="font-mono text-[0.8125rem]">+ {d.name}{d.version ? ` (${d.version})` : ''}</span>
                  <span className="text-[var(--text-tertiary)]">{d.manifest}</span>
                </DetailRow>
              ))}
            </DetailSection>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function DetailSection({ title, status, children }: { title: string; status: AnalysisCheckStatus; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{title}</h3>
        <Badge variant={status}>{status.toUpperCase()}</Badge>
      </div>
      <div className="space-y-1">{children}</div>
    </Card>
  );
}

function DetailRow({ status, children }: { status: AnalysisCheckStatus; children: React.ReactNode }) {
  const borderColor = status === 'fail'
    ? 'border-l-[var(--status-fail)]'
    : status === 'warn'
      ? 'border-l-[var(--status-warn)]'
      : 'border-l-transparent';

  return (
    <div className={`flex items-center justify-between rounded-[4px] border-l-2 ${borderColor} bg-[var(--surface-secondary)] px-3 py-1.5 text-[var(--text-primary)]`}>
      {children}
    </div>
  );
}
