type Props = {
  message: string
  onDismiss?: () => void
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="alert error" role="alert">
      <span>{message}</span>
      {onDismiss ? (
        <button
          type="button"
          className="link-btn small"
          style={{ marginLeft: '0.75rem' }}
          onClick={onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}
