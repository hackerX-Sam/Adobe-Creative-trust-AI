/**
 * Authentication shell — Adobe-style split-screen login / sign-up.
 *
 * • On the live Vercel deployment (auth configured): the workspace is locked
 *   behind this page until a valid session cookie exists.
 *   – "Continue with Google" → OAuth flow (server-side, stored in Postgres)
 *   – Email + password       → scrypt-hashed accounts (stored in Postgres)
 * • Locally / when auth is not configured (configured:false): the app runs in
 *   open demo mode — no gate.
 *
 * Sign-ins are recorded server-side in Neon Postgres (users + signins tables).
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ScanSearch,
  Fingerprint,
  ShieldCheck,
  Activity,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { apiGetAuth, apiLogin, apiSignup } from './api'
import type { AuthUser } from './api'

interface AuthInfo {
  checked: boolean
  backend: boolean
  configured: boolean
  user: AuthUser | null
}

interface AuthCtxValue {
  configured: boolean
  user: AuthUser | null
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthCtxValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<AuthInfo>({ checked: false, backend: false, configured: false, user: null })

  const refresh = useCallback(async () => {
    try {
      const a = await apiGetAuth()
      setInfo({ checked: true, backend: true, ...a })
    } catch {
      // no reachable backend (e.g. local dev without .env) → open demo mode
      setInfo({ checked: true, backend: false, configured: false, user: null })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

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

  // any deployment with a live backend (i.e. the Vercel site) requires sign-in.
  // The Google button is offered only when its credentials are configured;
  // email + password sign-up / login always works.
  if (info.backend && !info.user) {
    return <AuthPage googleReady={info.configured} onSuccess={refresh} />
  }

  return (
    <AuthCtx.Provider value={{ configured: info.configured, user: info.user, refresh }}>
      {children}
    </AuthCtx.Provider>
  )
}

// ─── Adobe brand mark (matches the favicon) ─────────────────────────────────

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#FF3B30" />
      <path fill="#ffffff" d="M19 6h7v20zM13 6H6v20zM16 13l6.2 13h-4.1L16 20.2l-2.2 5.8H9.7z" />
    </svg>
  )
}

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

// ─── Auth page ───────────────────────────────────────────────────────────────

type Mode = 'signin' | 'signup'

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Sign-in was cancelled — the Google consent screen was dismissed.',
  state_mismatch: 'Sign-in session expired or was tampered with. Please try again.',
  token_exchange_failed: 'Google rejected the sign-in code. Check the OAuth client configuration in Vercel.',
  userinfo_failed: 'Could not read your Google profile. Please try again.',
  profile_incomplete: 'Your Google account did not expose the required email/profile scopes.',
}

function AuthPage({ googleReady, onSuccess }: { googleReady: boolean; onSuccess: () => Promise<void> }) {
  const [mode, setMode] = useState<Mode>('signin')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'google' | 'form' | null>(null)

  // sign-in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // sign-up fields
  const [name, setName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get('auth_error')
      if (raw) {
        setError(ERROR_MESSAGES[raw] ?? `Google sign-in failed (${raw}).`)
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch { /* ignore */ }
  }, [])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy('form')
    try {
      if (mode === 'signin') {
        await apiLogin(email.trim(), password)
      } else {
        await apiSignup(name.trim(), newEmail.trim(), newPassword)
      }
      await onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    } finally {
      setBusy(null)
    }
  }

  const googleStart = () => {
    if (busy) return
    if (!googleReady) {
      setError('Google sign-in is not configured on this deployment yet — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy. Email sign-in works right now.')
      return
    }
    setBusy('google')
    window.location.assign('/api/auth/google/start')
  }

  const inputCls = 'input-base mt-1.5'
  const labelCls = 'text-micro font-medium text-ink2'

  return (
    <div className="flex min-h-screen bg-base">
      {/* ── Brand panel (desktop) ─────────────────────────────────────────── */}
      <aside className="relative hidden w-[44%] max-w-[620px] flex-col justify-between overflow-hidden border-r border-line p-10 lg:flex">
        {/* red/orange glow + forensic grid backdrop */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(90% 70% at 10% 0%, rgba(255,59,48,0.18), transparent 60%), radial-gradient(70% 60% at 100% 100%, rgba(255,106,0,0.12), transparent 60%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11" />
            <div>
              <p className="text-body font-semibold tracking-tight text-ink">Adobe CreativeTrust AI</p>
              <p className="text-micro text-ink3">Media authenticity & forensics workspace</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-page font-semibold leading-tight tracking-tight text-ink">
            Know what's real
            <span className="text-accent">.</span>
            <br />
            Verify every asset before it ships.
          </h2>
          <p className="mt-3 max-w-md text-tiny leading-relaxed text-ink2">
            A live verification pipeline for creative teams — AI-content detection, manipulation
            forensics, C2PA provenance and asset fingerprinting, updated in real time.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: ScanSearch, title: 'Real media forensics', desc: 'Magic-byte, entropy and EXIF analysis on the actual file bytes.' },
              { icon: Fingerprint, title: 'Fingerprint registry', desc: 'pHash + SHA-256 tracking to surface re-use and deepfakes.' },
              { icon: ShieldCheck, title: 'C2PA credentials', desc: 'Provenance chains from capture camera to final export.' },
              { icon: Activity, title: 'Live team workspace', desc: 'Every browser stays in sync within ~2 seconds.' },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-accent">
                  <f.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">{f.title}</span>
                  <span className="block text-tiny text-ink2">{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-micro text-ink3">
          © 2026 CreativeTrust AI · Conceptual prototype — forensic results are simulated · v1.0.0
        </p>
      </aside>

      {/* ── Form panel ────────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="animate-fadeUp w-full max-w-md">
          {/* mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark className="h-9 w-9" />
            <p className="text-body font-semibold tracking-tight text-ink">Adobe CreativeTrust AI</p>
          </div>

          <div className="card p-7">
            {/* tabs */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-line bg-elevated p-1" role="tablist">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-md px-3 py-2 text-[13px] font-semibold transition-all ${
                    mode === m ? 'bg-accent text-white shadow-accent' : 'text-ink2 hover:text-ink'
                  }`}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <h1 className="text-section font-semibold text-ink">
              {mode === 'signin' ? 'Welcome back' : 'Join the workspace'}
            </h1>
            <p className="mt-1 text-tiny text-ink2">
              {mode === 'signin'
                ? 'Sign in to access the live forensics dashboard.'
                : 'Create your account — it is stored securely in the workspace database.'}
            </p>

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-tiny text-danger">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              onClick={googleStart}
              disabled={busy !== null}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] font-medium text-[#1F1F1F] shadow transition hover:bg-[#F6F6F8] disabled:opacity-60"
            >
              {busy === 'google' ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleG className="h-5 w-5" />}
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-micro uppercase tracking-[0.08em] text-ink3">or with email</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className={labelCls}>Full name</label>
                  <input
                    id="auth-name"
                    className={inputCls}
                    placeholder="e.g. Samir Antsk"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className={labelCls}>Email</label>
                <input
                  id="auth-email"
                  type="email"
                  className={inputCls}
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={mode === 'signin' ? email : newEmail}
                  onChange={(e) => (mode === 'signin' ? setEmail(e.target.value) : setNewEmail(e.target.value))}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className={labelCls}>Password</label>
                  {mode === 'signin' && (
                    <span className="text-micro text-ink3" title="Accounts are created on the Sign up tab">Forgot password?</span>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-base w-full pr-10"
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={mode === 'signin' ? password : newPassword}
                    onChange={(e) => (mode === 'signin' ? setPassword(e.target.value) : setNewPassword(e.target.value))}
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink3 transition-colors hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary btn-md w-full justify-center" disabled={busy !== null}>
                {busy === 'form' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 border-t border-line pt-3.5 text-center text-micro leading-relaxed text-ink3">
              {mode === 'signup'
                ? 'Your name, email and a salted scrypt password hash are stored in the workspace database. Every sign-in is recorded in the audit log.'
                : 'Sessions are stored server-side and expire after 30 days. Every sign-in is recorded in the audit log.'}
            </p>
          </div>

          <p className="mt-4 text-center text-micro text-ink3">
            {mode === 'signin' ? (
              <>New here?{' '}
                <button onClick={() => switchMode('signup')} className="font-semibold text-accent transition-opacity hover:opacity-80">
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="font-semibold text-accent transition-opacity hover:opacity-80">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
