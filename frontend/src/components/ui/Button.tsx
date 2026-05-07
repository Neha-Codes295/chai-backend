import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'accent' | 'secondary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  wide?: boolean
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  accent: 'btn accent',
  secondary: 'btn secondary',
  ghost: 'btn ghost',
  danger: 'btn danger',
}

export function Button({
  variant = 'accent',
  wide,
  className = '',
  type = 'button',
  children,
  ...rest
}: Props) {
  const wideClass = wide ? ' wide' : ''
  return (
    <button
      type={type}
      className={`${variantClass[variant]}${wideClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
