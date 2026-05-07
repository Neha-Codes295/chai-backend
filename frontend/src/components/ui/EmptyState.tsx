import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="page-center stack-center" style={{ textAlign: 'center' }}>
      <h2 className="page-title" style={{ marginBottom: '0.35rem' }}>
        {title}
      </h2>
      {description ? <p className="muted">{description}</p> : null}
      {action ? <div style={{ marginTop: '0.5rem' }}>{action}</div> : null}
    </div>
  )
}
