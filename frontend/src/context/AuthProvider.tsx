import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  apiFetch,
  formatApiErrors,
  readApiResponse,
  registerSessionRefresh,
} from '../api/client'
import type { User } from '../types/user'

type LoginPayload = {
  email?: string
  username?: string
  password: string
}

export type AuthActionResult = {
  ok: boolean
  message?: string
  errors?: unknown[]
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  sessionError: string | null
  refreshSession: () => Promise<void>
  login: (payload: LoginPayload) => Promise<AuthActionResult>
  logout: () => Promise<void>
  register: (formData: FormData) => Promise<AuthActionResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function postRefreshToken(): Promise<boolean> {
  const res = await apiFetch('/api/v1/users/refresh-token', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  const { ok } = await readApiResponse<{ accessToken?: string }>(res)
  return ok
}

async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiFetch('/api/v1/users/current-user')
  const { ok, data } = await readApiResponse<User>(res)
  if (!ok || !data) return null
  return data
}

function toAuthResult(parsed: {
  ok: boolean
  message?: string
  errors?: unknown[]
}): AuthActionResult {
  if (parsed.ok) return { ok: true }
  return {
    ok: false,
    message: formatApiErrors(parsed.message, parsed.errors),
    errors: parsed.errors,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const refreshSession = useCallback(async () => {
    setSessionError(null)
    let current = await fetchCurrentUser()
    if (!current) {
      const refreshed = await postRefreshToken()
      if (refreshed) {
        current = await fetchCurrentUser()
      }
    }
    setUser(current)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refreshSession()
      } catch {
        if (!cancelled) setSessionError('Could not restore session.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshSession])

  useEffect(() => {
    const tryRefreshAfter401 = async () => {
      const ok = await postRefreshToken()
      if (!ok) {
        setUser(null)
        return false
      }
      const next = await fetchCurrentUser()
      setUser(next)
      return !!next
    }

    registerSessionRefresh(tryRefreshAfter401)
    return () => registerSessionRefresh(null)
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiFetch('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const parsed = await readApiResponse<{ user?: User }>(res)
    if (parsed.ok && parsed.data?.user) {
      setUser(parsed.data.user)
      return { ok: true }
    }
    return toAuthResult(parsed)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/users/logout', { method: 'POST' })
    } catch {} finally {
      setUser(null)
    }
  }, [])

  const register = useCallback(async (formData: FormData) => {
    const res = await apiFetch('/api/v1/users/register', {
      method: 'POST',
      body: formData,
    })
    const parsed = await readApiResponse<unknown>(res)
    if (parsed.ok) return { ok: true }
    return toAuthResult(parsed)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      sessionError,
      refreshSession,
      login,
      logout,
      register,
    }),
    [user, loading, sessionError, refreshSession, login, logout, register],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
