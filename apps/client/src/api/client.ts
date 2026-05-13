import { type Project, type ProjectFull, type Setting, type Shot, type EdgeData, type GenerationTask } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

/**
 * Fetch a presigned URL for a shot's generated video.
 * Call once and use the returned URL as <video src>.
 */
export async function getShotVideoUrl(shotId: string): Promise<string> {
  const res = await fetch(`${BASE}/shots/${shotId}/video`);
  if (!res.ok) throw new Error('Video not ready');
  const data = await res.json();
  return data.url;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 304) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  getProjectFull: (id: string) => request<ProjectFull>(`/projects/${id}/full`),
  createProject: (title: string) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify({ title }) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Shots
  createShot: (data: { projectId: string; order?: number }) =>
    request<Shot>('/shots', { method: 'POST', body: JSON.stringify(data) }),
  updateShot: (id: string, data: Partial<Shot>) =>
    request<Shot>(`/shots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShot: (id: string) =>
    request<void>(`/shots/${id}`, { method: 'DELETE' }),
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
  getShotsWithStatus: (projectId: string) =>
    request<Shot[]>(`/projects/${projectId}/shots`),
  merge: (projectId: string) =>
    request<{ ok: boolean; outputPath: string }>(`/projects/${projectId}/merge`, {
      method: 'POST',
    }),

  // Settings
  getSettings: () => request<Setting[]>('/settings'),
  getSettingsByProvider: (provider: string) => request<Setting[]>(`/settings/${provider}`),
  updateSettings: (items: { key: string; value: string }[]) =>
    request<Setting[]>('/settings', { method: 'PUT', body: JSON.stringify({ items }) }),
};
