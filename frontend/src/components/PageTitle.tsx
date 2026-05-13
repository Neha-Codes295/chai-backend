import { Helmet } from 'react-helmet-async'

type Props = {
  title: string
}

export function PageTitle({ title }: Props) {
  const full = title === 'Playtube' ? 'Playtube' : `${title} · Playtube`
  return (
    <Helmet>
      <title>{full}</title>
    </Helmet>
  )
}
