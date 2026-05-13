import { apiFetchWithRefresh, readApiResponse } from './client'

export type SubscriptionChannel = {
  _id?: string
  fullname?: string
  username?: string
  avatar?: string
}

export type SubscriptionRow = {
  _id: string
  channel?: SubscriptionChannel | string | null
}

export function getSubscriptionChannelId(row: SubscriptionRow): string | null {
  const ch = row.channel
  if (!ch) return null
  if (typeof ch === 'string' && ch.trim()) return ch.trim()
  if (typeof ch === 'object' && ch._id != null) return String(ch._id)
  return null
}

export async function fetchSubscribedChannels(): Promise<{
  ok: boolean
  data?: SubscriptionRow[]
  message?: string
}> {
  const res = await apiFetchWithRefresh('/api/v1/subscriptions')
  return readApiResponse<SubscriptionRow[]>(res)
}

export async function toggleSubscription(
  channelId: string,
): Promise<{ ok: boolean; data?: { subscribed: boolean }; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/subscriptions/${encodeURIComponent(channelId)}`,
    { method: 'POST' },
  )
  return readApiResponse<{ subscribed: boolean }>(res)
}
