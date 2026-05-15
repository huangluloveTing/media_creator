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

function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  draftStoryboard: (params: {
    projectId: string;
    instruction: string;
    baseDraft?: unknown;
    mode?: 'fast' | 'detailed';
  }) =>
    request<{
      draftId: string;
      version: number;
      summary: string;
      storyboard: unknown;
      diff: string[];
    }>('/llm/storyboard/draft', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  draftStoryboardStream: async (
    params: {
      projectId: string;
      instruction: string;
      baseDraft?: unknown;
      mode?: 'fast' | 'detailed';
    },
    handlers: {
      onProgress?: (payload: { stage: string }) => void;
      onToken?: (payload: { chunk: string }) => void;
      onClarification?: (payload: { question: string }) => void;
      onConstraintSummary?: (payload: { characterProfile?: unknown }) => void;
      onPrepExtracted?: (payload: { prepType: string; data: unknown }) => void;
      onPrepSwitched?: (payload: { prepType: string; nodeId: string }) => void;
      onCharacterDraft?: (payload: { stage: string }) => void;
      onCharacterConfirmationNeeded?: (payload: { message: string }) => void;
      onCharacterSummary?: (payload: { characterProfile?: unknown }) => void;
      onDone: (payload: {
        draftId: string;
        version: number;
        summary: string;
        storyboard: unknown;
        diff: string[];
        characterProfile?: unknown;
      }) => void;
      onError?: (message: string) => void;
    },
  ) => {
    const res = await fetch(`${BASE}/llm/storyboard/draft/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'SSE request failed');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const eventLine = part
          .split('\n')
          .find((line) => line.startsWith('event:'))
          ?.replace('event:', '')
          .trim();
        const dataLine = part
          .split('\n')
          .find((line) => line.startsWith('data:'))
          ?.replace('data:', '')
          .trim();
        if (!eventLine || !dataLine) continue;
        const payload = JSON.parse(dataLine);
        if (eventLine === 'progress') handlers.onProgress?.(payload);
        if (eventLine === 'token') handlers.onToken?.(payload);
        if (eventLine === 'clarification') handlers.onClarification?.(payload);
        if (eventLine === 'constraint-summary') handlers.onConstraintSummary?.(payload);
        if (eventLine === 'prep-extracted') handlers.onPrepExtracted?.(payload);
        if (eventLine === 'prep-switched') handlers.onPrepSwitched?.(payload);
        if (eventLine === 'character-draft') handlers.onCharacterDraft?.(payload);
        if (eventLine === 'character-confirmation-needed')
          handlers.onCharacterConfirmationNeeded?.(payload);
        if (eventLine === 'character-summary') handlers.onCharacterSummary?.(payload);
        if (eventLine === 'done') handlers.onDone(payload);
        if (eventLine === 'error') handlers.onError?.(payload.message ?? 'draft failed');
      }
    }
  },

  // Settings
  getSettings: () => request<Setting[]>('/settings'),
  getSettingsByProvider: (provider: string) => request<Setting[]>(`/settings/${provider}`),
  updateSettings: (items: { key: string; value: string }[]) =>
    request<Setting[]>('/settings', { method: 'PUT', body: JSON.stringify({ items }) }),
  draftPrepStream: async (
    params: {
      projectId: string;
      prepType: string;
      instruction: string;
      currentData?: Record<string, unknown>;
    },
    handlers: {
      onToken?: (payload: { chunk: string }) => void;
      onPrepExtracted?: (payload: { prepType: string; data: unknown }) => void;
      onDone: (payload: { text: string; extracted: unknown }) => void;
      onError?: (message: string) => void;
    },
  ) => {
    const res = await fetch(`${BASE}/llm/prep/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'Prep SSE request failed');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const eventLine = part
          .split('\n')
          .find((line) => line.startsWith('event:'))
          ?.replace('event:', '')
          .trim();
        const dataLine = part
          .split('\n')
          .find((line) => line.startsWith('data:'))
          ?.replace('data:', '')
          .trim();
        if (!eventLine || !dataLine) continue;
        const payload = JSON.parse(dataLine);
        if (eventLine === 'token') handlers.onToken?.(payload);
        if (eventLine === 'prep-extracted') handlers.onPrepExtracted?.(payload);
        if (eventLine === 'done') handlers.onDone(payload);
        if (eventLine === 'error') handlers.onError?.(payload.message ?? 'prep draft failed');
      }
    }
  },

  getStoryboardDrafts: (projectId: string) =>
    request<
      {
        id: string;
        version: number;
        summary?: string;
        diff?: { lines?: string[] };
        storyboard?: unknown;
        characterProfile?: unknown;
        isApplied?: boolean;
        appliedAt?: string | null;
        createdAt?: string;
      }[]
    >(`/projects/${projectId}/storyboard/drafts`),
  applyStoryboard: (projectId: string, draftId: string, mode: 'replace_all') =>
    request<{ ok: boolean; appliedVersion: number; shotCount: number }>(
      `/projects/${projectId}/storyboard/apply`,
      {
        method: 'POST',
        body: JSON.stringify({ draftId, mode }),
      },
    ),
};
