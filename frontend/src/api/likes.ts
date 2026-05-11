import { apiFetchWithRefresh, readApiResponse } from './client'

export type ToggleLikePayload = { liked: boolean }

export async function toggleVideoLike(
  videoId: string,
): Promise<{ ok: boolean; data?: ToggleLikePayload; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/likes/v/${encodeURIComponent(videoId)}`,
    { method: 'POST' },
  )
  return readApiResponse<ToggleLikePayload>(res)
}

export async function toggleCommentLike(
  commentId: string,
): Promise<{ ok: boolean; data?: ToggleLikePayload; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/likes/c/${encodeURIComponent(commentId)}`,
    { method: 'POST' },
  )
  return readApiResponse<ToggleLikePayload>(res)
}
