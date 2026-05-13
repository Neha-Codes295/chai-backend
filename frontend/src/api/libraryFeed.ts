import { fetchSubscribedChannels } from './subscriptions'
import { fetchChannelVideosPage } from './videos'
import {
  dedupeVideoSummariesById,
  normalizeVideoDocs,
  sortVideoSummariesByDateDesc,
} from '../lib/videoSummary'
import type { SubscriptionRow } from './subscriptions'
import type { VideoSummary } from '../types/video'

const MAX_CHANNELS = 8
const PER_CHANNEL = 4
const FEED_CAP = 24

function usernamesFromSubscriptions(rows: SubscriptionRow[]): string[] {
  const names: string[] = []
  for (const row of rows) {
    const ch = row.channel
    if (ch && typeof ch === 'object' && typeof ch.username === 'string') {
      const u = ch.username.trim().toLowerCase()
      if (u && !names.includes(u)) names.push(u)
    }
    if (names.length >= MAX_CHANNELS) break
  }
  return names
}

export async function fetchMergedSubscriptionFeed(
  rows?: SubscriptionRow[],
): Promise<{
  ok: boolean
  data?: VideoSummary[]
  message?: string
}> {
  let list = rows
  if (!list) {
    const subs = await fetchSubscribedChannels()
    if (!subs.ok || !Array.isArray(subs.data)) {
      return {
        ok: false,
        message: subs.message || 'Could not load subscriptions.',
      }
    }
    list = subs.data
  }

  const usernames = usernamesFromSubscriptions(list)
  if (usernames.length === 0) {
    return { ok: true, data: [] }
  }

  const settled = await Promise.allSettled(
    usernames.map((username) =>
      fetchChannelVideosPage(username, 1, PER_CHANNEL),
    ),
  )

  const raw: unknown[] = []
  for (const s of settled) {
    if (s.status !== 'fulfilled') continue
    const r = s.value
    if (r.ok && r.data?.docs?.length) {
      raw.push(...r.data.docs)
    }
  }

  const normalized = normalizeVideoDocs(raw)
  const merged = sortVideoSummariesByDateDesc(
    dedupeVideoSummariesById(normalized),
  ).slice(0, FEED_CAP)

  return { ok: true, data: merged }
}
