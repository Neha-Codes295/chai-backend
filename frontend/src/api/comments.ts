import { apiFetchWithRefresh, readApiResponse } from './client'
import type { CommentItem, CommentsPagePayload } from '../types/comment'

export async function fetchCommentsPage(
  videoId: string,
  page: number,
  limit = 10,
): Promise<{ ok: boolean; data?: CommentsPagePayload; message?: string }> {
  const clamped = Math.min(50, Math.max(1, limit))
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(clamped),
  })
  const res = await apiFetchWithRefresh(
    `/api/v1/comments/${encodeURIComponent(videoId)}?${qs}`,
  )
  return readApiResponse<CommentsPagePayload>(res)
}

export async function postComment(
  videoId: string,
  content: string,
): Promise<{ ok: boolean; data?: CommentItem; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/comments/${encodeURIComponent(videoId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
  )
  return readApiResponse<CommentItem>(res)
}

export async function patchComment(
  commentId: string,
  content: string,
): Promise<{ ok: boolean; data?: CommentItem; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/comments/c/${encodeURIComponent(commentId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    },
  )
  return readApiResponse<CommentItem>(res)
}

export async function deleteComment(
  commentId: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/comments/c/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' },
  )
  return readApiResponse<unknown>(res)
}
