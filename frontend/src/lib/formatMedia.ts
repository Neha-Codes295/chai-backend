export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds % 60)
  const m = Math.floor((seconds / 60) % 60)
  const h = Math.floor(seconds / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatViewCount(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1000) return `${Math.round(n)} views`
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K views`
  return `${(n / 1_000_000).toFixed(1)}M views`
}

export function formatPublishedLabel(iso: string | undefined): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const wk = Math.floor(day / 7)
  const mo = Math.floor(day / 30)
  const yr = Math.floor(day / 365)
  if (yr > 0) return `${yr}y ago`
  if (mo > 0) return `${mo}mo ago`
  if (wk > 0) return `${wk}w ago`
  if (day > 0) return `${day}d ago`
  if (hr > 0) return `${hr}h ago`
  if (min > 0) return `${min}m ago`
  return 'just now'
}
