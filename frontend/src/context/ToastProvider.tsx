import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  pushToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((tid: string) => {
    const t = timers.current.get(tid)
    if (t) clearTimeout(t)
    timers.current.delete(tid)
    setToasts((prev) => prev.filter((x) => x.id !== tid))
  }, [])

  const pushToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const tid = id()
      setToasts((prev) => [...prev, { id: tid, message, variant }])
      timers.current.set(
        tid,
        setTimeout(() => remove(tid), variant === 'error' ? 7000 : 5000),
      )
    },
    [remove],
  )

  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t)
      timers.current.clear()
    }
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast toast-${t.variant}`}
          >
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
