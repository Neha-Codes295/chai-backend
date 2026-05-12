import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats, type DashboardStats } from '../api/dashboard'
import {
  deleteVideoApi,
  fetchMyVideosPage,
  patchVideoMeta,
  toggleVideoPublish,
} from '../api/videos'
import { Button, EmptyState, ErrorBanner, Input, Spinner } from '../components/ui'
import type { VideoDetail } from '../types/video'

const PAGE_LIMIT = 12

type StudioRow = {
  _id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  views: number
  isPublished: boolean
}

function rowFromDoc(raw: unknown): StudioRow | null {
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
  const desc = typeof v.description === 'string' ? v.description : ''
  const views = typeof v.views === 'number' ? v.views : 0
  const pub = v.isPublished === false ? false : true
  return {
    _id: String(id),
    title,
    description: desc,
    thumbnail,
    duration: durationNum,
    views,
    isPublished: pub,
  }
}

function normalizeRows(docs: unknown[]): StudioRow[] {
  const out: StudioRow[] = []
  for (const d of docs) {
    const r = rowFromDoc(d)
    if (r) out.push(r)
  }
  return out
}

function detailToRow(v: VideoDetail): StudioRow {
  return {
    _id: v._id,
    title: v.title,
    description: typeof v.description === 'string' ? v.description : '',
    thumbnail: v.thumbnail,
    duration: v.duration,
    views: typeof v.views === 'number' ? v.views : 0,
    isPublished: v.isPublished === false ? false : true,
  }
}

export function StudioPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [rows, setRows] = useState<StudioRow[]>([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalDocs, setTotalDocs] = useState<number | null>(null)

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [busyId, setBusyId] = useState<string | null>(null)

  const [editRow, setEditRow] = useState<StudioRow | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPublished, setEditPublished] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    const r = await fetchDashboardStats()
    if (r.ok && r.data) setStats(r.data)
    else setStats(null)
    setStatsLoading(false)
  }, [])

  const loadPage1 = useCallback(async () => {
    setLoadingInitial(true)
    setError(null)
    const r = await fetchMyVideosPage(1, PAGE_LIMIT)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not load your videos.')
      setRows([])
      setHasNextPage(false)
      setTotalDocs(null)
    } else {
      setRows(normalizeRows(r.data.docs as unknown[]))
      setPage(r.data.page)
      setHasNextPage(Boolean(r.data.hasNextPage))
      setTotalDocs(typeof r.data.totalDocs === 'number' ? r.data.totalDocs : null)
    }
    setLoadingInitial(false)
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadPage1()
  }, [loadPage1])

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || loadingInitial) return
    setLoadingMore(true)
    setError(null)
    const next = page + 1
    const r = await fetchMyVideosPage(next, PAGE_LIMIT)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not load more.')
      setLoadingMore(false)
      return
    }
    const incoming = normalizeRows(r.data.docs as unknown[])
    setRows((prev) => {
      const seen = new Set(prev.map((x) => x._id))
      const merged = [...prev]
      for (const row of incoming) {
        if (!seen.has(row._id)) {
          seen.add(row._id)
          merged.push(row)
        }
      }
      return merged
    })
    setPage(r.data.page)
    setHasNextPage(Boolean(r.data.hasNextPage))
    setLoadingMore(false)
  }, [hasNextPage, loadingMore, loadingInitial, page])

  function openEdit(row: StudioRow) {
    setEditRow(row)
    setEditTitle(row.title)
    setEditDescription(row.description)
    setEditPublished(row.isPublished)
  }

  function closeEdit() {
    if (savingEdit) return
    setEditRow(null)
  }

  async function saveEdit() {
    if (!editRow) return
    const t = editTitle.trim()
    const d = editDescription.trim()
    if (!t || !d) {
      setError('Title and description cannot be empty.')
      return
    }
    setSavingEdit(true)
    setError(null)
    const r = await patchVideoMeta(editRow._id, {
      title: t,
      description: d,
      isPublished: editPublished,
    })
    setSavingEdit(false)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not save changes.')
      return
    }
    const updated = detailToRow(r.data)
    setRows((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
    setEditRow(null)
  }

  async function onTogglePublish(row: StudioRow) {
    setBusyId(row._id)
    setError(null)
    const r = await toggleVideoPublish(row._id)
    setBusyId(null)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not update publish state.')
      return
    }
    const updated = detailToRow(r.data)
    setRows((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
  }

  async function onDelete(row: StudioRow) {
    const ok = window.confirm(`Delete “${row.title}”? This cannot be undone.`)
    if (!ok) return
    setBusyId(row._id)
    setError(null)
    const r = await deleteVideoApi(row._id)
    setBusyId(null)
    if (!r.ok) {
      setError(r.message || 'Could not delete video.')
      return
    }
    setRows((prev) => prev.filter((x) => x._id !== row._id))
    setTotalDocs((n) => (typeof n === 'number' ? Math.max(0, n - 1) : n))
    void loadStats()
  }

  const showEmpty = !loadingInitial && rows.length === 0 && !error

  return (
    <div className="page">
      <div className="studio-head">
        <h1 className="page-title">Studio</h1>
        <Link to="/upload" className="btn accent">
          Upload
        </Link>
      </div>

      {statsLoading ?
        <p className="muted small">Loading dashboard…</p>
      : stats ?
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.totalVideos}</span>
            <span className="stat-label">Videos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalSubscribers}</span>
            <span className="stat-label">Subscribers</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalSubscribed}</span>
            <span className="stat-label">Subscriptions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalCommentsOnChannel}</span>
            <span className="stat-label">Comments on channel</span>
          </div>
        </div>
      : null}

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      {loadingInitial ?
        <Spinner center label="Loading your videos…" />
      : showEmpty ?
        <EmptyState
          title="No uploads yet"
          description="Upload a video to see it listed here."
          action={<Link to="/upload">Upload</Link>}
        />
      : <>
          <p className="muted small">
            {totalDocs != null ?
              `${totalDocs} video${totalDocs === 1 ? '' : 's'}`
            : `${rows.length} loaded`}
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const busy = busyId === row._id
                  return (
                    <tr key={row._id}>
                      <td>
                        <div className="table-video">
                          <img
                            className="table-thumb"
                            src={row.thumbnail}
                            alt=""
                          />
                          <span>{row.title}</span>
                        </div>
                      </td>
                      <td>{row.views}</td>
                      <td>{row.isPublished ? 'Published' : 'Draft'}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            to={`/watch/${row._id}`}
                            className="btn ghost small"
                          >
                            Watch
                          </Link>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void onTogglePublish(row)}
                          >
                            {busy ? '…' : row.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            disabled={busy}
                            onClick={() => void onDelete(row)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {hasNextPage ?
            <div style={{ marginTop: '1rem' }}>
              <Button
                type="button"
                variant="secondary"
                wide
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          : null}
        </>
      }

      {editRow ?
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeEdit()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="studio-edit-title" className="page-title" style={{ fontSize: '1.1rem' }}>
              Edit video
            </h2>
            <form
              className="stack-form"
              style={{ marginTop: '0.75rem' }}
              onSubmit={(e) => {
                e.preventDefault()
                void saveEdit()
              }}
            >
              <Input
                label="Title"
                name="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <div className="field">
                <label htmlFor="studio-edit-desc">Description</label>
                <textarea
                  id="studio-edit-desc"
                  name="edit-description"
                  className="input-textarea"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="field flex-row">
                <input
                  id="studio-edit-pub"
                  type="checkbox"
                  checked={editPublished}
                  onChange={(e) => setEditPublished(e.target.checked)}
                />
                <label htmlFor="studio-edit-pub">Published</label>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => closeEdit()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      : null}
    </div>
  )
}
