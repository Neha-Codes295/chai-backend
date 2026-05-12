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

export async function uploadVideo(formData: FormData): Promise<{
  ok: boolean
  data?: VideoDetail
  message?: string
}> {
  const res = await apiFetchWithRefresh('/api/v1/videos', {
    method: 'POST',
    body: formData,
  })
  return readApiResponse<VideoDetail>(res)
}

export async function fetchMyVideosPage(
  page: number,
  limit = 10,
): Promise<{ ok: boolean; data?: VideosPageResult; message?: string }> {
  const clamped = Math.min(50, Math.max(1, limit))
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(clamped),
  })
  const res = await apiFetchWithRefresh(`/api/v1/videos/my?${qs}`)
  return readApiResponse<VideosPageResult>(res)
}

export async function toggleVideoPublish(
  videoId: string,
): Promise<{ ok: boolean; data?: VideoDetail; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/videos/${encodeURIComponent(videoId)}/publish`,
    { method: 'PATCH' },
  )
  return readApiResponse<VideoDetail>(res)
}

export async function patchVideoMeta(
  videoId: string,
  body: { title?: string; description?: string; isPublished?: boolean },
): Promise<{ ok: boolean; data?: VideoDetail; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/videos/${encodeURIComponent(videoId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
  return readApiResponse<VideoDetail>(res)
}

export async function deleteVideoApi(
  videoId: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/videos/${encodeURIComponent(videoId)}`,
    { method: 'DELETE' },
  )
  return readApiResponse<unknown>(res)
}
