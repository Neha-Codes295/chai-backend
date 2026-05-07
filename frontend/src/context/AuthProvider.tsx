import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, readApiResponse } from '../api/client'
import type { User } from '../types/user'

type LoginPayload = {
  email?: string
  username?: string
  password: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  sessionError: string | null
  refreshSession: () => Promise<void>
  login: (payload: LoginPayload) => Promise<{ ok: boolean; message?: string }>
  logout: () => Promise<void>
  register: (formData: FormData) => Promise<{ ok: boolean; message?: string }>
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

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiFetch('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const { ok, message, data } = await readApiResponse<{ user?: User }>(res)
    if (ok && data?.user) {
      setUser(data.user)
      return { ok: true }
    }
    return { ok: false, message: message || 'Login failed' }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/users/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const register = useCallback(async (formData: FormData) => {
    const res = await apiFetch('/api/v1/users/register', {
      method: 'POST',
      body: formData,
    })
    const { ok, message } = await readApiResponse<unknown>(res)
    return { ok, message: message || (ok ? 'Registered' : 'Registration failed') }
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
