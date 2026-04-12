import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
} from 'jose'
import { env } from '../config/env.js'
import { supabase } from '../lib/supabase.js'

const issuer = () => `${env.supabaseUrl.replace(/\/$/, '')}/auth/v1`

/** Lazy JWKS for ECC/RS256 tokens (Supabase “JWT Signing Keys” migration). */
let jwks
function getJwks() {
  if (!jwks) {
    const url = new URL(`${issuer()}/.well-known/jwks.json`)
    jwks = createRemoteJWKSet(url)
  }
  return jwks
}

function mapPayloadToUser(payload) {
  if (!payload.sub) return null
  return {
    id: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  }
}

/**
 * Verify Supabase access tokens:
 * - HS256 + legacy JWT secret (older projects / rotating keys still issuing HS256)
 * - ES256/RS256 via JWKS (current “JWT Signing Keys” / ECC)
 * Falls back to getUser() if local verification fails (network to JWKS, edge cases).
 */
export async function requireSupabaseAuth(req, res, next) {
  const header = req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' })
  }

  const verifyOpts = {
    issuer: issuer(),
    audience: 'authenticated',
    clockTolerance: 30,
  }

  try {
    let headerAlg
    try {
      headerAlg = decodeProtectedHeader(token).alg
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    let payload

    if (headerAlg === 'HS256' && env.supabaseJwtSecret) {
      const key = new TextEncoder().encode(env.supabaseJwtSecret)
      ;({ payload } = await jwtVerify(token, key, {
        ...verifyOpts,
        algorithms: ['HS256'],
      }))
    } else {
      ;({ payload } = await jwtVerify(token, getJwks(), verifyOpts))
    }

    const user = mapPayloadToUser(payload)
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    req.token = token
    return next()
  } catch {
    try {
      const { data, error } = await supabase.auth.getUser(token)
      if (error || !data?.user) {
        return res.status(401).json({ error: 'Invalid or expired token' })
      }
      req.user = data.user
      req.token = token
      return next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }
}
