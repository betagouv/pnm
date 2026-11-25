import {CallOut} from '@codegouvfr/react-dsfr/CallOut'
import {Link, type To} from 'react-router'

type SousObjectifCallOutProps = {
  readonly enjeu: string
  readonly objectif: string
  readonly sousObjectif: string
  // The page of the sous-objectif
  readonly to: To
}

// Where a habitat or an espèce stands in the plan de gestion
export function SousObjectifCallOut({enjeu, objectif, sousObjectif, to}: SousObjectifCallOutProps) {
  return (
    <CallOut title='Dans le plan de gestion' titleAs='h2'>
      {`Enjeu : ${enjeu}. Objectif à long terme : ${objectif}.`}
      <br />
      <Link to={to}>{`Voir le sous-objectif « ${sousObjectif} »`}</Link>
    </CallOut>
  )
}
