import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator.tsx';
import { PlatformPicker } from '../components/PlatformPicker.tsx';
import {
  fetchPlatforms,
  fetchRepos,
  addRepo,
  removeRepo,
  completeSetup,
  fetchConfigValue,
  setConfigValue,
  browseFolder,
} from '../lib/api.ts';
import type { PlatformDetection, RepoResponse } from '../lib/api.ts';

/* ---------- Types ---------- */

interface WizardState {
  step: number;
  platform: string;
  apiProvider: string;
  apiKey: string;
}

const STEPS = [
  { label: 'Platform' },
  { label: 'Repositories' },
  { label: 'API Key' },
];

const API_PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Other'];

const DEFAULT_STATE: WizardState = {
  step: 0,
  platform: '',
  apiProvider: '',
  apiKey: '',
};

/* ---------- Component ---------- */

export function SetupWizard() {
  const navigate = useNavigate();

  const [wizardState, setWizardState] = useState<WizardState>(DEFAULT_STATE);
  const [platforms, setPlatforms] = useState<PlatformDetection[]>([]);
  const [repos, setRepos] = useState<RepoResponse[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingRepo, setAddingRepo] = useState(false);
  const [browsing, setBrowsing] = useState(false);

  const { step, platform, apiProvider, apiKey } = wizardState;

  /* ---- persist helper ---- */
  const persistState = useCallback(async (state: WizardState) => {
    try {
      await setConfigValue('wizard_state', state);
    } catch {
      // non-critical; ignore
    }
  }, []);

  /* ---- update helper that also persists ---- */
  const updateState = useCallback(
    (patch: Partial<WizardState>) => {
      setWizardState((prev) => {
        const next = { ...prev, ...patch };
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  /* ---- load initial data ---- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [platformsData, reposData] = await Promise.all([
          fetchPlatforms(),
          fetchRepos(),
        ]);

        if (cancelled) return;
        setPlatforms(platformsData);
        setRepos(reposData);

        // Restore saved wizard state
        try {
          const saved = await fetchConfigValue<{ value: WizardState }>('wizard_state');
          if (!cancelled && saved?.value && typeof saved.value === 'object') {
            const restored = saved.value;
            // If platform wasn't chosen yet, don't skip past step 0
            if (!restored.platform && restored.step > 0) {
              restored.step = 0;
            }
            setWizardState(restored);
          }
        } catch {
          // no saved state; use defaults
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load setup data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ---- repo actions ---- */
  async function handleAddRepo() {
    const trimmed = repoInput.trim();
    if (!trimmed) return;

    setAddingRepo(true);
    setError(null);
    try {
      const repo = await addRepo(trimmed);
      setRepos((prev) => [...prev, repo]);
      setRepoInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository');
    } finally {
      setAddingRepo(false);
    }
  }

  async function handleRemoveRepo(id: string) {
    setError(null);
    try {
      await removeRepo(id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove repository');
    }
  }

  /* ---- browse folder ---- */
  async function handleBrowse() {
    setBrowsing(true);
    setError(null);
    try {
      const result = await browseFolder();
      if (result?.path) {
        setRepoInput(result.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open folder picker');
    } finally {
      setBrowsing(false);
    }
  }

  /* ---- navigation ---- */
  function handleBack() {
    if (step > 0) updateState({ step: step - 1 });
  }

  function handleNext() {
    if (step < STEPS.length - 1) updateState({ step: step + 1 });
  }

  async function handleFinish() {
    setError(null);
    try {
      await completeSetup(platform);
      if (apiKey) {
        await setConfigValue('api_key', { provider: apiProvider, key: apiKey });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    }
  }

  /* ---- can proceed? ---- */
  const canNext = step === 0 ? platform !== '' : true;
  const canFinish = true; // API key is optional

  /* ---- loading / error states ---- */
  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <h1 className="mb-6 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Setup Wizard
        </h1>
        <p className="text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div className="max-w-[640px]">
      {/* Header */}
      <h1 className="mb-6 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        Setup Wizard
      </h1>

      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-[8px] border border-[var(--status-fail)] bg-[var(--status-fail-bg)] px-4 py-3 text-[0.875rem] text-[var(--status-fail)]">
          {error}
        </div>
      )}

      {/* Panel content */}
      <div className="rounded-[8px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
        {/* Panel 1: Platform */}
        {step === 0 && (
          <div>
            <h2 className="mb-1 text-[1rem] font-semibold text-[var(--text-primary)]">
              Choose your AI platform
            </h2>
            <p className="mb-4 text-[0.875rem] text-[var(--text-secondary)]">
              Select the coding assistant you primarily use. VibeLint will tailor its
              configuration files for this platform.
            </p>
            <PlatformPicker
              platforms={platforms}
              selected={platform}
              onSelect={(id) => updateState({ platform: id })}
            />
          </div>
        )}

        {/* Panel 2: Repositories */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-[1rem] font-semibold text-[var(--text-primary)]">
              Add repositories
            </h2>
            <p className="mb-4 text-[0.875rem] text-[var(--text-secondary)]">
              Enter the path to each repository you want VibeLint to manage.
            </p>

            {/* Input row */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRepo(); }}
                placeholder="/path/to/your/repo"
                className="flex-1 rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--focus-ring)]"
              />
              <button
                onClick={handleBrowse}
                disabled={browsing}
                className="rounded-[6px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-[0.875rem] font-medium text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--surface-hover)] disabled:opacity-50 cursor-pointer"
                title="Browse for folder"
              >
                {browsing ? 'Finding...' : <FolderOpen size={16} />}
              </button>
              <button
                onClick={handleAddRepo}
                disabled={addingRepo || !repoInput.trim()}
                className="rounded-[6px] bg-[var(--accent-primary)] px-4 py-2 text-[0.875rem] font-medium text-[var(--text-inverse)] transition-colors duration-100 hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {addingRepo ? 'Adding...' : 'Add'}
              </button>
            </div>

            {/* Repo list */}
            {repos.length === 0 ? (
              <p className="text-[0.875rem] text-[var(--text-tertiary)]">
                No repositories added yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {repos.map((repo) => (
                  <li
                    key={repo.id}
                    className="flex items-center justify-between rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.875rem] font-medium text-[var(--text-primary)] truncate">
                        {repo.name || repo.path}
                      </div>
                      {repo.languages.length > 0 && (
                        <div className="mt-0.5 flex gap-1.5">
                          {repo.languages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-[0.6875rem] text-[var(--accent-primary)]"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveRepo(repo.id)}
                      className="ml-3 shrink-0 rounded-[4px] border-none bg-transparent px-2 py-1 text-[0.75rem] text-[var(--text-tertiary)] transition-colors duration-100 hover:bg-[var(--status-fail-bg)] hover:text-[var(--status-fail)] cursor-pointer"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Panel 3: API Key */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 text-[1rem] font-semibold text-[var(--text-primary)]">
              API key (optional)
            </h2>
            <p className="mb-4 text-[0.875rem] text-[var(--text-secondary)]">
              Provide an API key if you want VibeLint to run AI-powered analysis.
              You can skip this and add it later in Settings.
            </p>

            {/* Provider dropdown */}
            <label className="mb-3 block">
              <span className="mb-1 block text-[0.75rem] font-medium text-[var(--text-secondary)]">
                Provider
              </span>
              <select
                value={apiProvider}
                onChange={(e) => updateState({ apiProvider: e.target.value })}
                className="w-full rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[0.875rem] text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--focus-ring)]"
              >
                <option value="">Select a provider...</option>
                {API_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            {/* Key input */}
            <label className="block">
              <span className="mb-1 block text-[0.75rem] font-medium text-[var(--text-secondary)]">
                API key
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => updateState({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full rounded-[6px] border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--focus-ring)]"
              />
            </label>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="rounded-[6px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-2 text-[0.875rem] font-medium text-[var(--text-primary)] transition-colors duration-100 hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="rounded-[6px] border-none bg-[var(--accent-primary)] px-4 py-2 text-[0.875rem] font-medium text-[var(--text-inverse)] transition-colors duration-100 hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-[6px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-2 text-[0.875rem] font-medium text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={handleFinish}
              disabled={!canFinish}
              className="rounded-[6px] border-none bg-[var(--accent-primary)] px-4 py-2 text-[0.875rem] font-medium text-[var(--text-inverse)] transition-colors duration-100 hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
