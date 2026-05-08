type Props = {
  message: string
  details?: string[]
  onDismiss?: () => void
}

export function ErrorBanner({ message, details, onDismiss }: Props) {
  return (
    <div className="alert error" role="alert">
      <div>
        <span>{message}</span>
        {details?.length ?
          <ul className="error-banner-list">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        : null}
      </div>
      {onDismiss ?
        <button
          type="button"
          className="link-btn small"
          style={{ marginLeft: '0.75rem' }}
          onClick={onDismiss}
        >
          Dismiss
        </button>
      : null}
    </div>
  )
}
