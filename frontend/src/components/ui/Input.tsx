import { forwardRef, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, id, error, hint, className = '', ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <input ref={ref} id={inputId} className="input" {...rest} />
      {hint ? <span className="small muted">{hint}</span> : null}
      {error ? (
        <span className="small" style={{ color: 'var(--danger)' }}>
          {error}
        </span>
      ) : null}
    </div>
  )
})
