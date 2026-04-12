/**
 * Map Google GenAI / network errors to stable HTTP responses for the app.
 * Logs should use the original `err`; clients only see `error` + `code`.
 */
export function mapGeminiError(err) {
  const raw = err?.message != null ? String(err.message) : String(err ?? '')
  const m = raw.toLowerCase()

  if (/429|rate limit|resource exhausted|quota|too many requests|consumer_suspended/i.test(raw)) {
    return {
      status: 503,
      code: 'AI_RATE_LIMIT',
      error:
        'The AI service is handling high demand right now. Please wait a minute and try again.',
      logTag: 'rate_limit',
    }
  }

  if (
    /\b503\b|\b504\b|unavailable|overloaded|deadline exceeded|timeout|try again later|econnreset|socket/i.test(
      m
    ) ||
    m.includes('model is overloaded')
  ) {
    return {
      status: 503,
      code: 'AI_OVERLOADED',
      error: 'The AI service is temporarily busy. Please try again in a moment.',
      logTag: 'overloaded',
    }
  }

  if (/404|not found|does not exist|invalid model|model.*not available|failed to load model/i.test(m)) {
    return {
      status: 503,
      code: 'AI_MODEL_UNAVAILABLE',
      error:
        'The AI model could not be loaded right now. Please try again later or contact support if this continues.',
      logTag: 'model',
    }
  }

  return {
    status: 500,
    code: 'AI_ERROR',
    error: 'Something went wrong while calling the AI service. Please try again.',
    logTag: 'unknown',
  }
}

export function sendGeminiError(res, err, logPrefix = '[Gemini]') {
  const mapped = mapGeminiError(err)
  console.error(logPrefix, mapped.logTag, err)
  return res.status(mapped.status).json({
    error: mapped.error,
    code: mapped.code,
  })
}
