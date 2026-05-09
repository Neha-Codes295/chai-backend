import { Link } from 'react-router-dom'
import type { VideoSummary } from '../types/video'
import {
  formatDuration,
  formatPublishedLabel,
  formatViewCount,
} from '../lib/formatMedia'

type Props = {
  video: VideoSummary
}

function ownerLabel(owner: VideoSummary['owner']): string {
  if (!owner) return 'Unknown channel'
  return owner.username ? `@${owner.username}` : owner.fullname || 'Channel'
}

export function VideoCard({ video }: Props) {
  const id = String(video._id)
  const owner = video.owner
  const initial =
    (owner?.username?.[0] || owner?.fullname?.[0] || '?').toUpperCase()

  return (
    <article className="video-card">
      <Link to={`/watch/${id}`} className="video-card-thumb-wrap">
        <img
          src={video.thumbnail}
          alt=""
          className="video-card-thumb"
          loading="lazy"
          decoding="async"
        />
        <span className="video-card-duration">
          {formatDuration(video.duration)}
        </span>
      </Link>
      <div className="video-card-meta">
        {owner?.avatar ?
          <img
            src={owner.avatar}
            alt=""
            className="video-card-avatar"
            width={40}
            height={40}
            loading="lazy"
          />
        : <span className="video-card-avatar placeholder-letter">{initial}</span>}
        <div>
          <Link to={`/watch/${id}`} className="video-card-title">
            {video.title}
          </Link>
          <div className="video-card-sub">
            {owner?.username ?
              <Link
                to={`/channel/${encodeURIComponent(owner.username)}`}
                className="video-card-channel"
              >
                {ownerLabel(owner)}
              </Link>
            : <span className="video-card-channel muted">{ownerLabel(owner)}</span>}
            <span className="muted">
              {formatViewCount(video.views)} ·{' '}
              {formatPublishedLabel(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
