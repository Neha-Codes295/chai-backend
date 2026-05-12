import { apiFetchWithRefresh, readApiResponse } from './client'

export type ChannelProfile = {
  _id: string
  fullname?: string
  username?: string
  avatar?: string
  coverImage?: string
  subscribersCount?: number
  channelsSubscribedToCount?: number
  isSubscribed?: boolean
}

function normalizeChannel(raw: unknown): ChannelProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const id = c._id
  if (typeof id !== 'string' && typeof id !== 'number') return null
  return {
    _id: String(id),
    fullname: typeof c.fullname === 'string' ? c.fullname : undefined,
    username: typeof c.username === 'string' ? c.username : undefined,
    avatar: typeof c.avatar === 'string' ? c.avatar : undefined,
    coverImage: typeof c.coverImage === 'string' ? c.coverImage : undefined,
    subscribersCount:
      typeof c.subscribersCount === 'number' ? c.subscribersCount : undefined,
    channelsSubscribedToCount:
      typeof c.channelsSubscribedToCount === 'number' ?
        c.channelsSubscribedToCount
      : undefined,
    isSubscribed: typeof c.isSubscribed === 'boolean' ? c.isSubscribed : undefined,
  }
}

export async function fetchChannelProfile(
  username: string,
): Promise<{ ok: boolean; data?: ChannelProfile; message?: string }> {
  const u = encodeURIComponent(username.trim().toLowerCase())
  const res = await apiFetchWithRefresh(`/api/v1/users/c/${u}`)
  const parsed = await readApiResponse<unknown>(res)
  if (!parsed.ok) {
    return { ok: false, message: parsed.message }
  }
  const data = normalizeChannel(parsed.data)
  if (!data) return { ok: false, message: 'Invalid channel response.' }
  return { ok: true, data }
}
