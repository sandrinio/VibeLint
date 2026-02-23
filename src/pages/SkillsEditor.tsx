import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Save, RotateCcw, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ToastContainer, type ToastData } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CreateItemDialog } from '../components/ui/CreateItemDialog';
import { RichMarkdownEditor } from '../components/editor/RichMarkdownEditor';
import {
  fetchRepos,
  fetchSkills,
  fetchSkill,
  saveSkill,
  createSkill,
  deleteSkill,
  resetSkill,
} from '../lib/api';
import type { RepoResponse, SkillResponse } from '../lib/api';

const STARTER_TEMPLATE = `# Skill Name

## Purpose

Describe what this skill does.

## Instructions

Provide instructions for the AI assistant.
`;

export default function SkillsEditor() {
  /* ---- State ---- */
  const [repos, setRepos] = useState<RepoResponse[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillResponse | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const toastIdRef = useRef(0);

  const hasUnsavedChanges = editorContent !== savedContent;

  /* ---- Helpers ---- */
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
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ---- Load skills when repo changes ---- */
  useEffect(() => {
    if (!selectedRepoId) return;
    let cancelled = false;
    setSkillsLoading(true);
    setSelectedSkillName(null);
    setSelectedSkill(null);
    setEditorContent('');
    setSavedContent('');

    async function loadSkills() {
      try {
        const data = await fetchSkills(selectedRepoId!);
        if (!cancelled) setSkills(data);
      } catch (err) {
        if (!cancelled) {
          setSkills([]);
          showToast(err instanceof Error ? err.message : 'Failed to load skills', 'error');
        }
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    }
    loadSkills();
    return () => { cancelled = true; };
  }, [selectedRepoId, showToast]);

  /* ---- Load skill content when selection changes ---- */
  useEffect(() => {
    if (!selectedRepoId || !selectedSkillName) return;
    let cancelled = false;

    async function loadSkill() {
      try {
        const data = await fetchSkill(selectedRepoId!, selectedSkillName!);
        if (!cancelled) {
          setSelectedSkill(data);
          setEditorContent(data.content);
          setSavedContent(data.content);
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'Failed to load skill content', 'error');
        }
      }
    }
    loadSkill();
    return () => { cancelled = true; };
  }, [selectedRepoId, selectedSkillName, showToast]);

  /* ---- Actions ---- */

  async function handleSave() {
    if (!selectedRepoId || !selectedSkillName) return;
    setSaving(true);
    try {
      const updated = await saveSkill(selectedRepoId, selectedSkillName, editorContent);
      setSelectedSkill(updated);
      setSavedContent(updated.content);
      setSkills((prev) => prev.map((s) => (s.name === updated.name ? updated : s)));
      showToast('Skill saved successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save skill', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!selectedRepoId || !selectedSkillName) return;
    try {
      const updated = await resetSkill(selectedRepoId, selectedSkillName);
      setSelectedSkill(updated);
      setEditorContent(updated.content);
      setSavedContent(updated.content);
      setSkills((prev) => prev.map((s) => (s.name === updated.name ? updated : s)));
      showToast('Skill reset to default', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset skill', 'error');
    }
  }

  async function handleDelete() {
    if (!selectedRepoId || !selectedSkillName) return;
    try {
      await deleteSkill(selectedRepoId, selectedSkillName);
      setSkills((prev) => prev.filter((s) => s.name !== selectedSkillName));
      setSelectedSkillName(null);
      setSelectedSkill(null);
      setEditorContent('');
      setSavedContent('');
      setShowDeleteConfirm(false);
      showToast('Skill deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete skill', 'error');
    }
  }

  async function handleCreate(name: string) {
    if (!selectedRepoId) return;
    try {
      const created = await createSkill(selectedRepoId, name, STARTER_TEMPLATE);
      setSkills((prev) => [...prev, created]);
      setSelectedSkillName(created.name);
      setShowCreateDialog(false);
      showToast('Skill created', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create skill', 'error');
    }
  }

  /* ---- Derived state ---- */
  const builtInSkills = skills.filter((s) => s.isDefault);
  const customSkills = skills.filter((s) => !s.isDefault);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <h1 className="mb-6 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Skills Editor
        </h1>
        <div className="py-12 text-center text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  /* ---- No repos state ---- */
  if (repos.length === 0) {
    return (
      <div className="max-w-[1200px]">
        <h1 className="mb-6 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Skills Editor
        </h1>
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--surface-primary)] py-16">
          <BookOpen size={40} className="text-[var(--text-tertiary)]" />
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
    <div className="flex h-[calc(100vh-48px-48px)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Skills Editor
        </h1>
        <div className="relative">
          <select
            value={selectedRepoId ?? ''}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="appearance-none rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-primary)] py-2 pl-3 pr-8 text-[0.875rem] text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--focus-ring)]"
          >
            {repos.map((repo) => (
              <option key={repo.id} value={repo.id}>{repo.name || repo.path}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left sidebar: skill list */}
        <aside className="flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[8px] border border-[var(--border-primary)] bg-[var(--surface-primary)]">
          <div className="flex-1 overflow-y-auto p-3">
            {skillsLoading ? (
              <div className="py-8 text-center text-[0.875rem] text-[var(--text-tertiary)]">Loading skills...</div>
            ) : (
              <>
                {builtInSkills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 px-2 text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                      Built-in Skills
                    </h3>
                    <ul className="space-y-0.5">
                      {builtInSkills.map((skill) => (
                        <li key={skill.name}>
                          <button
                            onClick={() => setSelectedSkillName(skill.name)}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-[6px] border-none px-2.5 py-2 text-left text-[0.875rem] transition-colors duration-100 ${
                              selectedSkillName === skill.name
                                ? 'bg-[var(--accent-subtle)] font-medium text-[var(--accent-primary)]'
                                : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">{skill.name}</span>
                            {skill.isModified && (
                              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--status-warn)]" title="Modified from default" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 px-2 text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                    Custom Skills
                  </h3>
                  {customSkills.length === 0 ? (
                    <p className="px-2 text-[0.8125rem] text-[var(--text-tertiary)]">No custom skills yet</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {customSkills.map((skill) => (
                        <li key={skill.name}>
                          <button
                            onClick={() => setSelectedSkillName(skill.name)}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-[6px] border-none px-2.5 py-2 text-left text-[0.875rem] transition-colors duration-100 ${
                              selectedSkillName === skill.name
                                ? 'bg-[var(--accent-subtle)] font-medium text-[var(--accent-primary)]'
                                : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">{skill.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-[var(--border-primary)] p-3">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-[var(--border-primary)] bg-transparent px-3 py-2 text-[0.875rem] font-medium text-[var(--text-secondary)] transition-colors duration-100 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)]"
            >
              <Plus size={14} />
              Create New Skill
            </button>
          </div>
        </aside>

        {/* Right main area: editor */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[var(--border-primary)] bg-[var(--surface-primary)]">
          {selectedSkill ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-[0.875rem] font-medium text-[var(--text-primary)]">{selectedSkill.name}</span>
                  {selectedSkill.isDefault && (
                    <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--accent-primary)]">Built-in</span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="rounded-full bg-[var(--status-warn-bg)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--status-warn)]">Unsaved changes</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedSkill.isDefault && (
                    <Button variant="secondary" size="sm" onClick={handleReset} title="Reset to default">
                      <RotateCcw size={13} />
                      Reset
                    </Button>
                  )}
                  {!selectedSkill.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} title="Delete skill" className="text-[var(--status-fail)] hover:border-[var(--status-fail)] hover:bg-[var(--status-fail-bg)]">
                      <Trash2 size={13} />
                      Delete
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
                    <Save size={13} />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <RichMarkdownEditor value={editorContent} onChange={setEditorContent} className="h-full" />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <BookOpen size={32} className="text-[var(--text-tertiary)]" />
              <p className="text-[0.875rem] text-[var(--text-tertiary)]">
                {skills.length === 0 ? 'No skills available for this repository' : 'Select a skill from the sidebar to begin editing'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateItemDialog
          title="Create New Skill"
          description="Choose a name for your custom skill. Use letters, numbers, hyphens, and underscores."
          placeholder="my-custom-skill"
          onConfirm={handleCreate}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}

      {showDeleteConfirm && selectedSkillName && (
        <ConfirmDialog
          title="Delete Skill"
          message={`Are you sure you want to delete "${selectedSkillName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
