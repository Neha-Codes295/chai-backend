import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMergedSubscriptionFeed } from '../api/libraryFeed'
import {
  fetchSubscribedChannels,
  getSubscriptionChannelId,
  toggleSubscription,
  type SubscriptionChannel,
  type SubscriptionRow,
} from '../api/subscriptions'
import { LibraryNav } from '../components/LibraryNav'
import { PageTitle } from '../components/PageTitle'
import { VideoCard } from '../components/VideoCard'
import { VideoGridSkeleton } from '../components/VideoGridSkeleton'
import { Button, EmptyState, ErrorBanner, Spinner } from '../components/ui'
import type { VideoSummary } from '../types/video'

export function SubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [feed, setFeed] = useState<VideoSummary[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await fetchSubscribedChannels()
    if (!r.ok || !Array.isArray(r.data)) {
      setError(r.message || 'Could not load subscriptions.')
      setRows([])
    } else {
      setRows(r.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (loading) return
    const hasSubs = rows.some((row) => getSubscriptionChannelId(row))
    if (!hasSubs) {
      setFeed([])
      setFeedLoading(false)
      setFeedError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setFeedLoading(true)
      setFeedError(null)
      const r = await fetchMergedSubscriptionFeed(rows)
      if (cancelled) return
      if (!r.ok || !r.data) {
        setFeed([])
        setFeedError(r.message || 'Could not load subscription feed.')
      } else {
        setFeed(r.data)
      }
      setFeedLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loading, rows])

  async function onUnfollow(channelId: string) {
    setBusyId(channelId)
    setError(null)
    const r = await toggleSubscription(channelId)
    setBusyId(null)
    if (!r.ok) {
      setError(r.message || 'Could not update subscription.')
      return
    }
    if (r.data?.subscribed === false) {
      setRows((prev) =>
        prev.filter((row) => getSubscriptionChannelId(row) !== channelId),
      )
    }
  }

  const rowsWithChannel = rows.filter((row) => getSubscriptionChannelId(row))

  return (
    <div className="page">
      <PageTitle title="Subscriptions" />
      <LibraryNav />
      <h1 className="page-title">Subscriptions</h1>

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      {loading ?
        <Spinner center label="Loading subscriptions…" />
      : (
        <>
          <section className="library-section" aria-labelledby="sub-feed-heading">
            <h2 id="sub-feed-heading" className="section-title">
              Latest from your channels
            </h2>
            {feedError ?
              <p className="muted small">{feedError}</p>
            : null}
            {feedLoading ?
              <VideoGridSkeleton />
            : feed.length > 0 ?
              <div className="video-grid">
                {feed.map((v) => (
                  <VideoCard key={v._id} video={v} />
                ))}
              </div>
            : rowsWithChannel.length > 0 ?
              <p className="muted small">
                No published videos yet from channels you follow.
              </p>
            : null}
          </section>

          <section className="library-section" aria-labelledby="sub-channels-heading">
            <h2 id="sub-channels-heading" className="section-title">
              Channels you follow
            </h2>
            {rowsWithChannel.length === 0 ?
              <EmptyState
                title="No subscriptions yet"
                description="Subscribe to channels to see them here and build your feed."
                action={<Link to="/">Browse home</Link>}
              />
            : (
              <ul className="sub-list">
                {rowsWithChannel.map((row) => {
                  const ch = row.channel
                  const cid = getSubscriptionChannelId(row) ?? ''
                  const busy = busyId === cid
                  const pop: SubscriptionChannel | null =
                    ch &&
                    typeof ch === 'object' &&
                    typeof (ch as SubscriptionChannel).username === 'string' ?
                      (ch as SubscriptionChannel)
                    : null
                  const displayName = pop?.fullname || pop?.username || 'Channel'
                  const username = pop?.username

                  return (
                    <li key={row._id} className="sub-row">
                      {pop?.avatar ?
                        <img
                          src={pop.avatar}
                          alt=""
                          className="sub-avatar"
                        />
                      : (
                        <div className="sub-avatar sub-avatar-fallback" aria-hidden>
                          {(username?.[0] || displayName[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <div className="sub-meta">
                        {username ?
                          <Link
                            to={`/channel/${encodeURIComponent(username)}`}
                            className="sub-name-link"
                          >
                            {displayName}
                          </Link>
                        : <span className="sub-name-link">{displayName}</span>}
                        {username ?
                          <span className="muted small">@{username}</span>
                        : (
                          <span className="muted small">
                            Profile unavailable — you can still unfollow.
                          </span>
                        )}
                      </div>
                      <div className="sub-row-actions">
                        {username ?
                          <Link
                            to={`/channel/${encodeURIComponent(username)}`}
                            className="btn ghost small"
                          >
                            Channel
                          </Link>
                        : null}
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy || !cid}
                          onClick={() => void onUnfollow(cid)}
                        >
                          {busy ? '…' : 'Unfollow'}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
