import { supabase } from './supabaseClient';

const backendUrl = (import.meta.env.VITE_AI_BACKEND_URL as string | undefined) || 'http://localhost:8080';

/** Thrown on non-OK AI backend responses; includes optional `code` from JSON (e.g. AI_OVERLOADED). */
export class ApiError extends Error {
  readonly code?: string;
  readonly httpStatus?: number;
  constructor(message: string, opts?: { code?: string; httpStatus?: number }) {
    super(message);
    this.name = 'ApiError';
    this.code = opts?.code;
    this.httpStatus = opts?.httpStatus;
  }
}

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

/**
 * Standardized API client for all backend calls to the AI/Logic backend.
 * Automatically handles Supabase session retrieval and token injection.
 */
export async function apiClient(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Automatically set Content-Type to JSON if sending a body and it's not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = '';
    let code: string | undefined;
    try {
      const json = await res.clone().json();
      if (json && typeof json === 'object') {
        const o = json as { error?: unknown; message?: unknown; code?: unknown; fields?: unknown };
        if (typeof o.error === 'string') {
          errorMsg = o.error;
        } else if (typeof o.message === 'string') {
          errorMsg = o.message;
        } else if (o.fields != null) {
          errorMsg = JSON.stringify(o.fields);
        }
        if (typeof o.code === 'string') {
          code = o.code;
        }
      }
    } catch {
      errorMsg = (await res.clone().text().catch(() => '')) || '';
    }

    const msg = (errorMsg || '').trim() || `API backend error (${res.status})`;
    throw new ApiError(msg, { code, httpStatus: res.status });
  }

  return res;
}
