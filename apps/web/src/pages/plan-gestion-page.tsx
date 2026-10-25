import {Tile} from '@codegouvfr/react-dsfr/Tile'
import type {Habitat} from '@pnm/shared'
import {Link} from 'react-router'
import {useParc} from '../parcs.ts'
import {
  actionPath,
  enjeuPath,
  habitatPath,
  usePlanGestion,
} from '../plan-gestion.ts'

function count(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`
}

// The habitats by habitat générique, which only sorts them
function byGenerique(habitats: readonly Habitat[]): Array<{titre: string, habitats: Habitat[]}> {
  const groups = new Map<string, Habitat[]>()

  for (const habitat of habitats) {
    const titre = habitat.habitatGenerique ? `${habitat.habitatGenerique.code} ${habitat.habitatGenerique.nom}` : 'Autres habitats'
    groups.set(titre, [...groups.get(titre) ?? [], habitat])
  }

  return [...groups].map(([titre, group]) => ({titre, habitats: group}))
}

export function PlanGestionPage() {
  const parc = useParc()!
  const plan = usePlanGestion()

  return (
    <>
      <title>{`Plan de gestion - ${parc.nom} - Mon Parc Marin`}</title>
      <h1>Plan de gestion</h1>
      <p className='fr-text--lead'>
        {`Le plan de gestion fixe les enjeux du ${parc.nomComplet.replace(/^Parc/v, 'parc')}, et les objectifs de gestion qui en découlent.`}
      </p>
      {plan.document !== undefined && (
        <p>
          <a
            className='fr-link fr-icon-file-pdf-line fr-link--icon-left'
            href={plan.document}
            target='_blank'
            rel='noopener noreferrer'
            title='Lire le plan de gestion (PDF) - nouvelle fenêtre'
          >
            Lire le plan de gestion (PDF)
          </a>
        </p>
      )}

      <h2 className='fr-mt-6w'>Les enjeux du parc</h2>
      <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
        {plan.enjeux.map(enjeu => (
          <li key={enjeu.id} className='fr-col-12 fr-col-sm-6 fr-col-lg-4'>
            <Tile
              small
              title={enjeu.libelle}
              titleAs='h3'
              desc={count(enjeu.objectifs.length, 'objectif à long terme', 'objectifs à long terme')}
              linkProps={{to: enjeuPath(parc.id, enjeu.id)}}
            />
          </li>
        ))}
      </ul>

      <h2 className='fr-mt-6w'>Les habitats</h2>
      <p>Les habitats élémentaires du plan de gestion, rangés par habitat générique.</p>
      {byGenerique(plan.habitats).map(group => (
        <section key={group.titre}>
          <h3 className='fr-h6 fr-mb-1w'>{group.titre}</h3>
          <ul>
            {group.habitats.map(habitat => (
              <li key={habitat.code}>
                <Link to={habitatPath(parc.id, habitat.code)}>{habitat.nom}</Link>
                {` (${habitat.code})`}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <h2 className='fr-mt-6w'>Les actions</h2>
      <ul>
        {plan.actions.map(action => (
          <li key={action.id}>
            <Link to={actionPath(parc.id, action.id)}>{action.libelle}</Link>
            {action.periode !== undefined && ` (${action.periode})`}
          </li>
        ))}
      </ul>
    </>
  )
}
