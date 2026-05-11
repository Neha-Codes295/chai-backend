import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteComment,
  fetchCommentsPage,
  patchComment,
  postComment,
} from '../../api/comments'
import { toggleCommentLike } from '../../api/likes'
import type { CommentItem } from '../../types/comment'
import type { User } from '../../types/user'
import { formatPublishedLabel } from '../../lib/formatMedia'
import { Button, ErrorBanner, Spinner } from '../ui'

type Props = {
  videoId: string
  user: User | null
}

function normalizeComment(raw: unknown): CommentItem | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const id = c._id
  const content = c.content
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof content !== 'string') {
    return null
  }
  let owner: CommentItem['owner'] = null
  const o = c.owner
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
    content,
    createdAt: typeof c.createdAt === 'string' ? c.createdAt : undefined,
    updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : undefined,
    owner,
  }
}

function isOwner(comment: CommentItem, user: User | null): boolean {
  if (!user || !comment.owner?._id) return false
  return String(comment.owner._id) === String(user._id)
}

export function CommentSection({ videoId, user }: Props) {
  const [items, setItems] = useState<CommentItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compose, setCompose] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentLiked, setCommentLiked] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const hasMore = items.length < total

  const loadPage = useCallback(
    async (p: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      const r = await fetchCommentsPage(videoId, p)
      if (!r.ok || !r.data) {
        setError(r.message || 'Could not load comments.')
        if (!append) setItems([])
      } else {
        const next = (r.data.data as unknown[]).map(normalizeComment).filter(Boolean) as CommentItem[]
        setTotal(r.data.total)
        setPage(r.data.page)
        if (append) {
          setItems((prev) => {
            const seen = new Set(prev.map((x) => x._id))
            const merged = [...prev]
            for (const c of next) {
              if (!seen.has(c._id)) {
                seen.add(c._id)
                merged.push(c)
              }
            }
            return merged
          })
        } else {
          setItems(next)
        }
      }
      setLoading(false)
      setLoadingMore(false)
    },
    [videoId],
  )

  useEffect(() => {
    setCommentLiked({})
    setEditingId(null)
    void loadPage(1, false)
  }, [videoId, loadPage])

  async function onSubmitComment(e: FormEvent) {
    e.preventDefault()
    if (!user || !compose.trim()) return
    setPosting(true)
    setError(null)
    const r = await postComment(videoId, compose.trim())
    if (r.ok && r.data) {
      const c = normalizeComment(r.data)
      if (c) setItems((prev) => [c, ...prev])
      setTotal((t) => t + 1)
      setCompose('')
    } else {
      setError(r.message || 'Could not post comment.')
    }
    setPosting(false)
  }

  async function onToggleCommentLike(commentId: string) {
    if (!user) return
    const r = await toggleCommentLike(commentId)
    if (r.ok && r.data && typeof r.data.liked === 'boolean') {
      setCommentLiked((prev) => ({ ...prev, [commentId]: r.data!.liked }))
    }
  }

  async function onDelete(commentId: string) {
    if (!window.confirm('Delete this comment?')) return
    const r = await deleteComment(commentId)
    if (r.ok) {
      setItems((prev) => prev.filter((c) => c._id !== commentId))
      setTotal((t) => Math.max(0, t - 1))
    } else {
      setError(r.message || 'Could not delete.')
    }
  }

  async function onSaveEdit(commentId: string) {
    const t = editDraft.trim()
    if (!t) return
    const r = await patchComment(commentId, t)
    if (r.ok && r.data) {
      const c = normalizeComment(r.data)
      if (c) {
        setItems((prev) => prev.map((x) => (x._id === commentId ? c : x)))
      }
      setEditingId(null)
    } else {
      setError(r.message || 'Could not update comment.')
    }
  }

  return (
    <section className="comments-section">
      <h2 className="section-title">Comments · {total}</h2>

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      {user ?
        <form className="comment-compose" onSubmit={(e) => void onSubmitComment(e)}>
          <label htmlFor="comment-box" className="sr-only">
            Write a comment
          </label>
          <textarea
            id="comment-box"
            className="input-textarea"
            placeholder="Add a public comment…"
            rows={3}
            value={compose}
            onChange={(e) => setCompose(e.target.value)}
          />
          <Button
            type="submit"
            disabled={posting || !compose.trim()}
          >
            {posting ? 'Posting…' : 'Comment'}
          </Button>
        </form>
      : (
        <p className="muted small">
          <Link to="/login">Sign in</Link> to comment and like.
        </p>
      )}

      {loading ?
        <Spinner label="Loading comments…" />
      : (
        <ul className="comment-list">
          {items.map((c) => (
            <li key={c._id} className="comment-row">
              {c.owner?.avatar ?
                <img
                  src={c.owner.avatar}
                  alt=""
                  className="comment-avatar"
                  width={40}
                  height={40}
                />
              : <span className="comment-avatar placeholder-letter">{(c.owner?.username?.[0] || '?').toUpperCase()}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="comment-head">
                  <strong>{c.owner?.username ? `@${c.owner.username}` : c.owner?.fullname || 'User'}</strong>
                  <span className="muted small">
                    {formatPublishedLabel(c.createdAt)}
                  </span>
                </div>
                {editingId === c._id ?
                  <div className="stack-form" style={{ marginTop: '0.5rem' }}>
                    <textarea
                      className="input-textarea"
                      rows={3}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                    />
                    <div className="watch-btns">
                      <Button
                        type="button"
                        className="small"
                        onClick={() => void onSaveEdit(c._id)}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="small"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                : <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap' }}>{c.content}</p>}
                <div className="watch-btns" style={{ marginTop: '0.5rem' }}>
                  {user ?
                    <Button
                      type="button"
                      variant="ghost"
                      className="small"
                      onClick={() => void onToggleCommentLike(c._id)}
                    >
                      {commentLiked[c._id] ? 'Liked' : 'Like'}
                    </Button>
                  : null}
                  {isOwner(c, user) && editingId !== c._id ?
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="small"
                        onClick={() => {
                          setEditingId(c._id)
                          setEditDraft(c.content)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        className="small"
                        onClick={() => void onDelete(c._id)}
                      >
                        Delete
                      </Button>
                    </>
                  : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && hasMore ?
        <div className="pager">
          <Button
            type="button"
            variant="secondary"
            disabled={loadingMore}
            onClick={() => void loadPage(page + 1, true)}
          >
            {loadingMore ? 'Loading…' : 'More comments'}
          </Button>
        </div>
      : null}
    </section>
  )
}
