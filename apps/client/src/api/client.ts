import {
  type Project,
  type ProjectFull,
  type Setting,
  type Shot,
  type EdgeData,
  type GenerationTask,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

/**
 * Fetch a presigned URL for a shot's generated video.
 * Call once and use the returned URL as <video src>.
 */
export async function getShotVideoUrl(shotId: string): Promise<string> {
  const res = await authFetch(`${BASE}/shots/${shotId}/video`);
  if (!res.ok) throw new Error('Video not ready');
  const data = await res.json();
  return data.url;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(`${BASE}${url}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (res.status === 304) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<{ token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Projects
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  getProjectFull: (id: string) => request<ProjectFull>(`/projects/${id}/full`),
  createProject: (data: {
    title: string;
    resolution?: string;
    fps?: number;
    defaultTransitionType?: string;
    globalStylePrompt?: string;
  }) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Shots
  createShot: (data: { projectId: string; order?: number }) =>
    request<Shot>('/shots', { method: 'POST', body: JSON.stringify(data) }),
  updateShot: (id: string, data: Partial<Shot>) =>
    request<Shot>(`/shots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShot: (id: string) => request<void>(`/shots/${id}`, { method: 'DELETE' }),
  reorderShot: (id: string, newOrder: number) =>
    request<void>(`/shots/${id}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ newOrder }),
    }),
  generateShot: (id: string) =>
    request<GenerationTask>(`/shots/${id}/generate`, { method: 'POST' }),

  // Edges
  updateEdge: (id: string, data: Partial<EdgeData>) =>
    request<EdgeData>(`/edges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Project-level actions
  generateAll: (projectId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/generate-all`, {
      method: 'POST',
    }),
  getShotsWithStatus: (projectId: string) => request<Shot[]>(`/projects/${projectId}/shots`),
  merge: (projectId: string) =>
    request<{ ok: boolean; url: string }>(`/projects/${projectId}/merge`, {
      method: 'POST',
    }),
  getFinalVideoUrl: (projectId: string) =>
    request<{ url: string }>(`/projects/${projectId}/final-video`),

  // LLM
  enhancePrompt: (params: {
    prompt: string;
    shotSize?: string;
    angle?: string;
    movement?: string;
    duration?: number;
  }) =>
    request<{ result: string }>('/llm/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Settings
  getSettings: () => request<Setting[]>('/settings'),
  getSettingsByProvider: (provider: string) => request<Setting[]>(`/settings/${provider}`),
  updateSettings: (items: { key: string; value: string }[]) =>
    request<Setting[]>('/settings', { method: 'PUT', body: JSON.stringify({ items }) }),
};
