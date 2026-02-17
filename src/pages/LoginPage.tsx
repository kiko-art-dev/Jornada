import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-surface-base)]">
      <div className="w-full max-w-sm px-6">
        <h1 className="mb-1 text-center text-2xl font-bold tracking-wider text-[var(--text-primary)]">
          JORNADA
        </h1>
        <p className="mb-8 text-center text-sm text-[var(--text-tertiary)]">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-raised)] p-6">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-[var(--text-muted)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-[var(--text-muted)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              placeholder="Your password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
