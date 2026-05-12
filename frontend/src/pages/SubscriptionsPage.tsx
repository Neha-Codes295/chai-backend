import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchSubscribedChannels,
  toggleSubscription,
  type SubscriptionRow,
} from '../api/subscriptions'
import { Button, EmptyState, ErrorBanner, Spinner } from '../components/ui'

export function SubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

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
        prev.filter((row) => String(row.channel?._id) !== String(channelId)),
      )
    }
  }

  const validRows = rows.filter((row) => row.channel?.username)

  return (
    <div className="page">
      <h1 className="page-title">Subscriptions</h1>

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      {loading ?
        <Spinner center label="Loading subscriptions…" />
      : validRows.length === 0 ?
        <EmptyState
          title="No subscriptions yet"
          description="Subscribe to channels to see them here."
          action={<Link to="/">Browse home</Link>}
        />
      : (
        <ul className="sub-list">
          {validRows.map((row) => {
            const ch = row.channel!
            const cid = String(ch._id ?? '')
            const busy = busyId === cid
            return (
              <li key={row._id} className="sub-row">
                {ch.avatar ?
                  <img
                    src={ch.avatar}
                    alt=""
                    className="sub-avatar"
                  />
                : (
                  <div className="sub-avatar sub-avatar-fallback" aria-hidden>
                    {(ch.username?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <div className="sub-meta">
                  <Link to={`/channel/${ch.username}`} className="sub-name-link">
                    {ch.fullname || ch.username}
                  </Link>
                  <span className="muted small">@{ch.username}</span>
                </div>
                <div className="sub-row-actions">
                  <Link to={`/channel/${ch.username}`} className="btn ghost small">
                    Channel
                  </Link>
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
    </div>
  )
}
