/**
 * Google sign-in gate.
 *
 * • On the live Vercel deployment (OAuth configured): the workspace is locked
 *   behind "Continue with Google" until a valid session cookie exists.
 * • Locally / when OAuth is not configured (configured:false): the app runs
 *   in open demo mode — no gate, sign-out stays simulated.
 *
 * Sign-ins themselves are recorded server-side in Neon Postgres
 * (users + signins tables) by /api/auth/google/callback.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { apiGetAuth } from './api'
import type { AuthUser } from './api'

interface AuthInfo {
  checked: boolean
  configured: boolean
  user: AuthUser | null
}

const AuthCtx = createContext<{ configured: boolean; user: AuthUser | null } | null>(null)

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<AuthInfo>({ checked: false, configured: false, user: null })

  useEffect(() => {
    let disposed = false
    apiGetAuth()
      .then((a) => { if (!disposed) setInfo({ checked: true, ...a }) })
      .catch(() => { if (!disposed) setInfo({ checked: true, configured: false, user: null }) })
    return () => { disposed = true }
  }, [])

  if (!info.checked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink3">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-tiny">Checking session…</p>
        </div>
      </div>
    )
  }

  if (info.configured && !info.user) {
    return <SignInGate />
  }

  return (
    <AuthCtx.Provider value={{ configured: info.configured, user: info.user }}>
      {children}
    </AuthCtx.Provider>
  )
}

// ─── Sign-in screen ──────────────────────────────────────────────────────────

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1L1.2 17.2C3.2 21.2 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.2 6.8C.4 8.4 0 10.1 0 12s.4 3.6 1.2 5.2L5 14.3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3 .8 3.7 1.4l3.3-3.2C17 1.1 14.2 0 12 0 7.3 0 3.2 2.8 1.2 6.8L5 9.7c1-2.9 3.8-4.9 7-4.9z" />
    </svg>
  )
}

function SignInGate() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get('auth_error')
      if (raw) {
        const messages: Record<string, string> = {
          access_denied: 'Sign-in was cancelled — the Google consent screen was dismissed.',
          state_mismatch: 'Sign-in session expired or was tampered with. Please try again.',
          token_exchange_failed: 'Google rejected the sign-in code. Check the OAuth client configuration in Vercel.',
          userinfo_failed: 'Could not read your Google profile. Please try again.',
          profile_incomplete: 'Your Google account did not expose the required email/profile scopes.',
        }
        setError(messages[raw] ?? `Sign-in failed (${raw}).`)
        // clean the URL so a refresh doesn't re-show the stale error
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch { /* ignore */ }
  }, [])

  const start = () => {
    window.location.assign('/api/auth/google/start')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="animate-fadeUp w-full max-w-sm">
        <div className="card p-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
              <path fill="#ffffff" d="M19 6h7v20zM13 6H6v20zM16 13l6.2 13h-4.1L16 20.2l-2.2 5.8H9.7z" />
            </svg>
          </div>
          <h1 className="mt-4 text-section font-semibold text-ink">Adobe CreativeTrust AI</h1>
          <p className="mt-1.5 text-tiny leading-relaxed text-ink2">
            The workspace is protected. Sign in with your Google account to access live forensics,
            verification history and real-time activity.
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-tiny text-danger">
              {error}
            </p>
          )}

          <button
            onClick={start}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] font-medium text-[#1F1F1F] shadow transition hover:bg-[#F6F6F8]"
          >
            <GoogleG className="h-5 w-5" />
            Continue with Google
          </button>

          <p className="mt-5 border-t border-line pt-3.5 text-micro leading-relaxed text-ink3">
            Your name, email and profile picture are stored in the workspace database.
            Every sign-in is recorded in the sign-in audit log. Sessions expire after 30 days.
          </p>
        </div>
        <p className="mt-4 text-center text-micro text-ink3">
          Adobe CreativeTrust AI · Conceptual prototype — forensic results are simulated · v1.0.0
        </p>
      </div>
    </div>
  )
}
