import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ToastContainer, type ToastData } from '../components/ui/Toast';
import { CreateItemDialog } from '../components/ui/CreateItemDialog';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import {
  fetchRepos,
  fetchRules,
  fetchCommands,
  saveRule,
  resetRule,
  saveCommand,
  createCommand,
  deleteCommand,
  resetCommand,
} from '../lib/api';
import type { RepoResponse, RuleResponse, CommandResponse } from '../lib/api';

export default function RulesEditor() {
  /* --- Repos --- */
  const [repos, setRepos] = useState<RepoResponse[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [loadingRepos, setLoadingRepos] = useState(true);

  /* --- Rules --- */
  const [platformRule, setPlatformRule] = useState<RuleResponse | null>(null);
  const [lessonsRule, setLessonsRule] = useState<RuleResponse | null>(null);
  const [platformDraft, setPlatformDraft] = useState('');
  const [lessonsDraft, setLessonsDraft] = useState('');

  /* --- Commands --- */
  const [commands, setCommands] = useState<CommandResponse[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [commandDrafts, setCommandDrafts] = useState<Record<string, string>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  /* --- Loading / toast --- */
  const [loadingData, setLoadingData] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---- Load repos on mount ---- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchRepos();
        if (!cancelled) {
          setRepos(data);
          if (data.length > 0) setSelectedRepoId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to load repos:', err);
      } finally {
        if (!cancelled) setLoadingRepos(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ---- Load rules & commands when repo changes ---- */
  useEffect(() => {
    if (!selectedRepoId) return;
    let cancelled = false;

    async function load() {
      setLoadingData(true);
      try {
        const [rulesData, commandsData] = await Promise.all([
          fetchRules(selectedRepoId),
          fetchCommands(selectedRepoId),
        ]);
        if (cancelled) return;

        const platform = rulesData.find((r) => r.type !== 'lessons-md') ?? null;
        const lessons = rulesData.find((r) => r.type === 'lessons-md') ?? null;

        setPlatformRule(platform);
        setLessonsRule(lessons);
        setPlatformDraft(platform?.content ?? '');
        setLessonsDraft(lessons?.content ?? '');

        setCommands(commandsData);
        const drafts: Record<string, string> = {};
        for (const cmd of commandsData) drafts[cmd.name] = cmd.content;
        setCommandDrafts(drafts);
        setSelectedCommand(commandsData.length > 0 ? commandsData[0].name : '');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to load rules and commands', 'error');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedRepoId, showToast]);

  /* ---- Handlers: Platform Rule ---- */

  async function handleSavePlatformRule() {
    if (!platformRule) return;
    try {
      const updated = await saveRule(selectedRepoId, platformRule.type, platformDraft);
      setPlatformRule(updated);
      setPlatformDraft(updated.content);
      showToast('Platform rule saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save platform rule', 'error');
    }
  }

  async function handleResetPlatformRule() {
    if (!platformRule) return;
    try {
      const updated = await resetRule(selectedRepoId, platformRule.type);
      setPlatformRule(updated);
      setPlatformDraft(updated.content);
      showToast('Platform rule reset to default', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset platform rule', 'error');
    }
  }

  /* ---- Handlers: Lessons ---- */

  async function handleSaveLessons() {
    if (!lessonsRule) return;
    try {
      const updated = await saveRule(selectedRepoId, lessonsRule.type, lessonsDraft);
      setLessonsRule(updated);
      setLessonsDraft(updated.content);
      showToast('LESSONS.md saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save LESSONS.md', 'error');
    }
  }

  async function handleResetLessons() {
    if (!lessonsRule) return;
    try {
      const updated = await resetRule(selectedRepoId, lessonsRule.type);
      setLessonsRule(updated);
      setLessonsDraft(updated.content);
      showToast('LESSONS.md reset to default', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset LESSONS.md', 'error');
    }
  }

  /* ---- Handlers: Commands ---- */

  async function handleSaveCommand(name: string) {
    const draft = commandDrafts[name];
    if (draft === undefined) return;
    try {
      const updated = await saveCommand(selectedRepoId, name, draft);
      setCommands((prev) => prev.map((c) => (c.name === name ? updated : c)));
      setCommandDrafts((prev) => ({ ...prev, [name]: updated.content }));
      showToast(`Command "${name}" saved`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to save command "${name}"`, 'error');
    }
  }

  async function handleResetCommandAction(name: string) {
    try {
      const updated = await resetCommand(selectedRepoId, name);
      setCommands((prev) => prev.map((c) => (c.name === name ? updated : c)));
      setCommandDrafts((prev) => ({ ...prev, [name]: updated.content }));
      showToast(`Command "${name}" reset to default`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to reset command "${name}"`, 'error');
    }
  }

  async function handleCreateCommand(name: string) {
    setShowCreateDialog(false);
    try {
      const created = await createCommand(selectedRepoId, name, '');
      setCommands((prev) => [...prev, created]);
      setCommandDrafts((prev) => ({ ...prev, [name]: created.content }));
      setSelectedCommand(name);
      showToast(`Command "${name}" created`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to create command "${name}"`, 'error');
    }
  }

  async function handleDeleteCommand(name: string) {
    if (!confirm(`Delete command "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCommand(selectedRepoId, name);
      setCommands((prev) => prev.filter((c) => c.name !== name));
      setCommandDrafts((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (selectedCommand === name) {
        const remaining = commands.filter((c) => c.name !== name);
        setSelectedCommand(remaining.length > 0 ? remaining[0].name : '');
      }
      showToast(`Command "${name}" deleted`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to delete command "${name}"`, 'error');
    }
  }

  /* ---- Helpers ---- */

  const platformHasChanges = platformRule !== null && platformDraft !== platformRule.content;
  const lessonsHasChanges = lessonsRule !== null && lessonsDraft !== lessonsRule.content;
  const currentCmd = commands.find((c) => c.name === selectedCommand);
  const commandHasChanges =
    currentCmd !== undefined && commandDrafts[currentCmd.name] !== currentCmd.content;

  /* ---- Loading / empty states ---- */

  if (loadingRepos) {
    return (
      <div className="max-w-[1200px]">
        <div className="py-12 text-center text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="max-w-[1200px]">
        <h1 className="mb-6 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Rules &amp; Commands
        </h1>
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] py-16">
          <FolderOpen size={40} className="text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)]">No repositories connected</p>
          <Link to="/setup">
            <Button variant="primary">Go to Setup</Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Main render ---- */

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Rules &amp; Commands
        </h1>
        <select
          value={selectedRepoId}
          onChange={(e) => setSelectedRepoId(e.target.value)}
          className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[0.875rem] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        >
          {repos.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {loadingData ? (
        <div className="py-12 text-center text-[var(--text-tertiary)]">Loading rules and commands...</div>
      ) : (
        <>
          {/* Section 1: Platform Rules */}
          <CollapsibleSection title={platformRule?.displayName ?? 'Platform Rule'} defaultOpen>
            {platformRule ? (
              <>
                <MarkdownEditor value={platformDraft} onChange={setPlatformDraft} />
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="primary" onClick={handleSavePlatformRule} disabled={!platformHasChanges}>Save</Button>
                  <Button variant="ghost" onClick={handleResetPlatformRule}><RotateCcw size={14} /> Reset to Default</Button>
                  {platformHasChanges && <span className="text-[0.75rem] text-[var(--text-tertiary)]">Unsaved changes</span>}
                </div>
              </>
            ) : (
              <p className="text-[0.875rem] text-[var(--text-tertiary)]">No platform rule found for this repository.</p>
            )}
          </CollapsibleSection>

          {/* Section 2: Slash Commands */}
          <CollapsibleSection title="Slash Commands" defaultOpen>
            <div className="flex gap-4">
              <div className="w-56 shrink-0 space-y-1">
                {commands.map((cmd) => (
                  <button
                    key={cmd.name}
                    onClick={() => setSelectedCommand(cmd.name)}
                    className={`w-full rounded-md px-3 py-2 text-left text-[0.875rem] transition-colors cursor-pointer ${
                      selectedCommand === cmd.name
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div className="font-medium">/{cmd.name}</div>
                    {cmd.description && <div className="mt-0.5 text-[0.75rem] text-[var(--text-tertiary)] truncate">{cmd.description}</div>}
                  </button>
                ))}
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-[0.875rem] text-[var(--brand-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  Add Custom Command
                </button>
              </div>

              <div className="min-w-0 flex-1">
                {currentCmd ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">/{currentCmd.name}</h3>
                      {!currentCmd.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCommand(currentCmd.name)}>
                          <Trash2 size={14} /> Delete
                        </Button>
                      )}
                    </div>
                    <MarkdownEditor
                      value={commandDrafts[currentCmd.name] ?? ''}
                      onChange={(val: string) => setCommandDrafts((prev) => ({ ...prev, [currentCmd.name]: val }))}
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="primary" onClick={() => handleSaveCommand(currentCmd.name)} disabled={!commandHasChanges}>Save</Button>
                      {currentCmd.isDefault && (
                        <Button variant="ghost" onClick={() => handleResetCommandAction(currentCmd.name)}><RotateCcw size={14} /> Reset to Default</Button>
                      )}
                      {commandHasChanges && <span className="text-[0.75rem] text-[var(--text-tertiary)]">Unsaved changes</span>}
                    </div>
                  </>
                ) : (
                  <p className="py-8 text-center text-[0.875rem] text-[var(--text-tertiary)]">
                    {commands.length === 0 ? 'No commands yet. Add a custom command to get started.' : 'Select a command from the list.'}
                  </p>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3: LESSONS.md */}
          <CollapsibleSection title="LESSONS.md" defaultOpen>
            {lessonsRule ? (
              <>
                <MarkdownEditor value={lessonsDraft} onChange={setLessonsDraft} />
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="primary" onClick={handleSaveLessons} disabled={!lessonsHasChanges}>Save</Button>
                  <Button variant="ghost" onClick={handleResetLessons}><RotateCcw size={14} /> Reset to Default</Button>
                  {lessonsHasChanges && <span className="text-[0.75rem] text-[var(--text-tertiary)]">Unsaved changes</span>}
                </div>
              </>
            ) : (
              <p className="text-[0.875rem] text-[var(--text-tertiary)]">No LESSONS.md found for this repository.</p>
            )}
          </CollapsibleSection>
        </>
      )}

      {showCreateDialog && (
        <CreateItemDialog
          title="Create Custom Command"
          description="Choose a name for your command. Use letters, numbers, hyphens, and underscores."
          placeholder="my-command"
          onConfirm={handleCreateCommand}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
