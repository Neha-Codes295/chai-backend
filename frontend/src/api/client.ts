export function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL?.trim()
  return base || ''
}

export function formatApiErrors(message?: string, errors?: unknown[]): string {
  const parts: string[] = []
  if (message?.trim()) parts.push(message.trim())
  if (errors?.length) {
    const rest = errors
      .map((e) => {
        if (typeof e === 'string') return e
        if (e && typeof e === 'object' && 'message' in e) {
          const m = (e as { message?: unknown }).message
          return typeof m === 'string' ? m : JSON.stringify(e)
        }
        return JSON.stringify(e)
      })
      .filter(Boolean)
      .join('. ')
    if (rest) parts.push(rest)
  }
  return parts.join(' — ') || 'Something went wrong'
}

function resolveUrl(path: string): string {
  const base = getApiBase()
  return path.startsWith('http') ? path : `${base}${path}`
}

function isRefreshExemptUrl(urlOrPath: string): boolean {
  let pathname = urlOrPath
  try {
    if (urlOrPath.includes('://')) pathname = new URL(urlOrPath).pathname
  } catch {}
  return (
    pathname.includes('/refresh-token') ||
    pathname.includes('/users/login') ||
    pathname.includes('/auth/login') ||
    pathname.includes('/users/register')
  )
}

let sessionRefreshFn: (() => Promise<boolean>) | null = null

export function registerSessionRefresh(fn: (() => Promise<boolean>) | null) {
  sessionRefreshFn = fn
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = resolveUrl(path)
  const headers = new Headers(init?.headers)

  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export async function apiFetchWithRefresh(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = resolveUrl(path)
  const first = await apiFetch(path, init)
  if (first.status !== 401 || isRefreshExemptUrl(url) || !sessionRefreshFn) {
    return first
  }

  const renewed = await sessionRefreshFn()
  if (!renewed) return first

  return apiFetch(path, init)
}

export async function readApiResponse<T>(
  res: Response,
): Promise<{ ok: boolean; data?: T; message?: string; errors?: unknown[] }> {
  let body: Record<string, unknown> = {}
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {}
  const successFlag = body.success
  const ok =
    res.ok &&
    (successFlag === undefined ? true : Boolean(successFlag))

  return {
    ok,
    data: body.data as T | undefined,
    message: typeof body.message === 'string' ? body.message : undefined,
    errors: Array.isArray(body.errors) ? body.errors : undefined,
  }
}
