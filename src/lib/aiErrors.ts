import { ApiError } from './apiClient';

/** Short title for modal header from backend `code` (e.g. AI_OVERLOADED). */
export function titleForAiErrorCode(code: string | null | undefined): string {
  if (!code) return 'Couldn’t complete request';
  if (code === 'AI_RATE_LIMIT' || code === 'AI_OVERLOADED') return 'AI is busy';
  if (code === 'AI_MODEL_UNAVAILABLE' || code === 'AI_MODEL_CONFIG') return 'Model unavailable';
  if (code === 'AI_NOT_CONFIGURED') return 'AI not configured';
  if (code.startsWith('AI_')) return 'AI request didn’t finish';
  return 'Something went wrong';
}

/** Maps fetch/api errors to a readable message (Insights, OCR, scenario, etc.). */
export function formatInsightsError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message?.trim()) {
    return err.message.trim();
  }
  if (err instanceof Error && err.message?.trim()) {
    const m = err.message.trim();
    if (m === 'Load failed' || m === 'Failed to fetch') {
      return 'AI service unreachable. Check your connection or try again.';
    }
    return m;
  }
  return fallback;
}

/** Sets message + optional server `code` from ApiError (for modal + reference line). */
export function applyAiFailure(
  err: unknown,
  setError: (s: string | null) => void,
  setErrorCode: (c: string | null) => void,
  fallback: string
) {
  if (err instanceof ApiError) {
    setError(err.message?.trim() || fallback);
    setErrorCode(err.code ?? null);
    return;
  }
  setErrorCode(null);
  setError(formatInsightsError(err, fallback));
}
