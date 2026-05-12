import type { VideoSummary } from '../types/video'

export function normalizeVideoDoc(raw: unknown): VideoSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  const id = v._id
  const title = v.title
  const thumbnail = v.thumbnail
  const durationRaw = v.duration
  const durationNum =
    typeof durationRaw === 'number' ? durationRaw : Number(durationRaw)
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof title !== 'string' ||
    typeof thumbnail !== 'string' ||
    !Number.isFinite(durationNum)
  ) {
    return null
  }
  let owner: VideoSummary['owner'] = null
  const o = v.owner
  if (o && typeof o === 'object') {
    const ow = o as Record<string, unknown>
    owner = {
      _id:
        typeof ow._id === 'string' ? ow._id
        : ow._id != null ? String(ow._id)
        : undefined,
      fullname: typeof ow.fullname === 'string' ? ow.fullname : undefined,
      username: typeof ow.username === 'string' ? ow.username : undefined,
      avatar: typeof ow.avatar === 'string' ? ow.avatar : undefined,
    }
  }
  return {
    _id: String(id),
    title,
    thumbnail,
    duration: durationNum,
    views: typeof v.views === 'number' ? v.views : undefined,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : undefined,
    owner,
  }
}

export function normalizeVideoDocs(docs: unknown[]): VideoSummary[] {
  const out: VideoSummary[] = []
  for (const d of docs) {
    const n = normalizeVideoDoc(d)
    if (n) out.push(n)
  }
  return out
}
