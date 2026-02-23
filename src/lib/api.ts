const BASE = '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string, method: string, path: string) {
    super(detail || `API ${method} ${path} failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error ?? '';
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, detail, init?.method ?? 'GET', path);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/* ---------- Types ---------- */

export interface PlatformDetection {
  id: string;
  name: string;
  detected: boolean;
  configPath: string | null;
}

export interface RepoResponse {
  id: string;
  path: string;
  name: string;
  languages: string[];
  lastScanAt: string | null;
}

export interface SetupStatus {
  completed: boolean;
  platform: string | null;
}

/* ---------- Platforms ---------- */

export function fetchPlatforms(): Promise<PlatformDetection[]> {
  return request<PlatformDetection[]>('/setup/platforms');
}

/* ---------- Repos ---------- */

export function fetchRepos(): Promise<RepoResponse[]> {
  return request<RepoResponse[]>('/repos');
}

export function addRepo(path: string): Promise<RepoResponse> {
  return request<RepoResponse>('/repos', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

export function removeRepo(id: string): Promise<void> {
  return request<void>(`/repos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/* ---------- Setup ---------- */

export function fetchSetupStatus(): Promise<SetupStatus> {
  return request<SetupStatus>('/setup/status');
}

export function completeSetup(platform: string): Promise<void> {
  return request<void>('/setup/complete', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
}

/* ---------- Config ---------- */

export function fetchConfigValue<T = unknown>(key: string): Promise<T> {
  return request<T>(`/config/${encodeURIComponent(key)}`);
}

export function setConfigValue<T = unknown>(key: string, value: T): Promise<void> {
  return request<void>(`/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

/* ---------- Skills ---------- */

export interface SkillResponse {
  name: string;
  category: string;
  content: string;
  isDefault: boolean;
  isModified: boolean;
}

export function fetchSkills(repoId: string): Promise<SkillResponse[]> {
  return request<SkillResponse[]>(`/repos/${encodeURIComponent(repoId)}/skills`);
}

export function fetchSkill(repoId: string, name: string): Promise<SkillResponse> {
  return request<SkillResponse>(`/repos/${encodeURIComponent(repoId)}/skills/${encodeURIComponent(name)}`);
}

export function saveSkill(repoId: string, name: string, content: string): Promise<SkillResponse> {
  return request<SkillResponse>(`/repos/${encodeURIComponent(repoId)}/skills/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function createSkill(repoId: string, name: string, content: string): Promise<SkillResponse> {
  return request<SkillResponse>(`/repos/${encodeURIComponent(repoId)}/skills`, {
    method: 'POST',
    body: JSON.stringify({ name, content }),
  });
}

export function deleteSkill(repoId: string, name: string): Promise<void> {
  return request<void>(`/repos/${encodeURIComponent(repoId)}/skills/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

export function resetSkill(repoId: string, name: string): Promise<SkillResponse> {
  return request<SkillResponse>(`/repos/${encodeURIComponent(repoId)}/skills/${encodeURIComponent(name)}/reset`, {
    method: 'POST',
  });
}

/* ---------- Rules ---------- */

export interface RuleResponse {
  type: string;
  displayName: string;
  content: string;
  isDefault: boolean;
  isModified: boolean;
}

export function fetchRules(repoId: string): Promise<RuleResponse[]> {
  return request<RuleResponse[]>(`/repos/${encodeURIComponent(repoId)}/rules`);
}

export function fetchRule(repoId: string, type: string): Promise<RuleResponse> {
  return request<RuleResponse>(`/repos/${encodeURIComponent(repoId)}/rules/${encodeURIComponent(type)}`);
}

export function saveRule(repoId: string, type: string, content: string): Promise<RuleResponse> {
  return request<RuleResponse>(`/repos/${encodeURIComponent(repoId)}/rules/${encodeURIComponent(type)}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function resetRule(repoId: string, type: string): Promise<RuleResponse> {
  return request<RuleResponse>(`/repos/${encodeURIComponent(repoId)}/rules/${encodeURIComponent(type)}/reset`, {
    method: 'POST',
  });
}

/* ---------- Commands ---------- */

export interface CommandResponse {
  name: string;
  content: string;
  description: string;
  isDefault: boolean;
  isModified: boolean;
}

export function fetchCommands(repoId: string): Promise<CommandResponse[]> {
  return request<CommandResponse[]>(`/repos/${encodeURIComponent(repoId)}/commands`);
}

export function saveCommand(repoId: string, name: string, content: string): Promise<CommandResponse> {
  return request<CommandResponse>(`/repos/${encodeURIComponent(repoId)}/commands/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function createCommand(repoId: string, name: string, content: string): Promise<CommandResponse> {
  return request<CommandResponse>(`/repos/${encodeURIComponent(repoId)}/commands`, {
    method: 'POST',
    body: JSON.stringify({ name, content }),
  });
}

export function deleteCommand(repoId: string, name: string): Promise<void> {
  return request<void>(`/repos/${encodeURIComponent(repoId)}/commands/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

export function resetCommand(repoId: string, name: string): Promise<CommandResponse> {
  return request<CommandResponse>(`/repos/${encodeURIComponent(repoId)}/commands/${encodeURIComponent(name)}/reset`, {
    method: 'POST',
  });
}

/* ---------- Filesystem ---------- */

export function browseFolder(): Promise<{ path: string } | null> {
  return request<{ path: string } | null>('/fs/browse', { method: 'POST' });
}
