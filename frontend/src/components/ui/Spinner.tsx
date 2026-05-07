type Props = {
  label?: string
  center?: boolean
}

export function Spinner({ label = 'Loading…', center }: Props) {
  const wrapClass = center ? 'page-center stack-center' : 'spinner-wrap'
  return (
    <div className={wrapClass} role="status" aria-live="polite">
      <div className="spinner" aria-hidden />
      <span className="small muted">{label}</span>
    </div>
  )
}
