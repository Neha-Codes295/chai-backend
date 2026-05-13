import { apiFetchWithRefresh, readApiResponse } from './client'

export type TweetItem = {
  _id: string
  content: string
  createdAt?: string
  updatedAt?: string
  owner?: string | { _id?: string }
}

export type TweetsPageResult = {
  data: TweetItem[]
  page: number
  limit: number
  total: number
}

export async function fetchUserTweetsPage(
  userId: string,
  page: number,
  limit = 10,
): Promise<{ ok: boolean; data?: TweetsPageResult; message?: string }> {
  const clamped = Math.min(50, Math.max(1, limit))
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(clamped),
  })
  const res = await apiFetchWithRefresh(
    `/api/v1/tweets/u/${encodeURIComponent(userId)}?${qs}`,
  )
  return readApiResponse<TweetsPageResult>(res)
}

export async function createTweet(content: string): Promise<{
  ok: boolean
  data?: TweetItem
  message?: string
}> {
  const res = await apiFetchWithRefresh('/api/v1/tweets', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return readApiResponse<TweetItem>(res)
}

export async function deleteTweetApi(
  tweetId: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/tweets/${encodeURIComponent(tweetId)}`,
    { method: 'DELETE' },
  )
  return readApiResponse<unknown>(res)
}
