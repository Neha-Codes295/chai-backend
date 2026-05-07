export function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL?.trim()
  return base || ''
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getApiBase()
  const url = path.startsWith('http') ? path : `${base}${path}`
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
