export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="video-grid" aria-busy="true" aria-label="Loading videos">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="video-card video-card-skeleton">
          <div className="video-card-thumb-wrap skeleton-block video-card-thumb" />
          <div className="video-card-meta">
            <div className="skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton-block skeleton-line-lg" />
              <div className="skeleton-block skeleton-line-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
