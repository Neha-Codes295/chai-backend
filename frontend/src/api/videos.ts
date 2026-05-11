import { apiFetchWithRefresh, readApiResponse } from './client'
import type { VideoDetail, VideosPageResult } from '../types/video'

const DEFAULT_LIMIT = 12

export async function fetchVideosPage(
  page: number,
  limit: number = DEFAULT_LIMIT,
): Promise<{
  ok: boolean
  data?: VideosPageResult
  message?: string
}> {
  const clampedLimit = Math.min(50, Math.max(1, limit))
  const safePage = Math.max(1, page)
  const qs = new URLSearchParams({
    page: String(safePage),
    limit: String(clampedLimit),
  })
  const res = await apiFetchWithRefresh(`/api/v1/videos?${qs}`)
  return readApiResponse<VideosPageResult>(res)
}

export async function fetchVideoById(
  videoId: string,
): Promise<{ ok: boolean; data?: VideoDetail; message?: string }> {
  const res = await apiFetchWithRefresh(`/api/v1/videos/${encodeURIComponent(videoId)}`)
  return readApiResponse<VideoDetail>(res)
}
