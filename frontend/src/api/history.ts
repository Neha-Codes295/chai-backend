import { apiFetchWithRefresh, readApiResponse } from './client'

export async function postWatchHistory(
  videoId: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await apiFetchWithRefresh('/api/v1/users/history', {
    method: 'POST',
    body: JSON.stringify({ videoId }),
  })
  return readApiResponse<unknown>(res)
}
