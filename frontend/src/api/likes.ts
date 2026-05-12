import { apiFetchWithRefresh, readApiResponse } from './client'

export type LikedVideosListResult = {
  data: unknown[]
  page: number
  limit: number
  total: number
}

export type ToggleLikePayload = { liked: boolean }

export async function fetchLikedVideosPage(
  page: number,
  limit = 12,
): Promise<{ ok: boolean; data?: LikedVideosListResult; message?: string }> {
  const clamped = Math.min(50, Math.max(1, limit))
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(clamped),
  })
  const res = await apiFetchWithRefresh(`/api/v1/likes/videos?${qs}`)
  return readApiResponse<LikedVideosListResult>(res)
}

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
