import {fr} from '@codegouvfr/react-dsfr'
import {Accordion} from '@codegouvfr/react-dsfr/Accordion'
import {lazy, Suspense} from 'react'
import {useLoaderData, useNavigate, useParams} from 'react-router'
import {ActionCards} from '../components/action-cards.tsx'
import {Benefices} from '../components/benefices.tsx'
import {EnjeuFilter} from '../components/enjeu-filter.tsx'
import {Figures} from '../components/figures.tsx'
import {ObjectifList} from '../components/objectif-list.tsx'
import {Pictogram} from '../components/pictogram.tsx'
import {PlanText} from '../components/plan-text.tsx'
import {TagLinks} from '../components/tag-links.tsx'
import type {EnjeuPageData} from '../habitats.ts'
import {useParc} from '../parcs.ts'
import {pictogramUrl} from '../pictograms.ts'
import {
  actionPath,
  actionStatut,
  enjeuActions,
  enjeuEspeces,
  enjeuHabitats,
  enjeuPath,
  enjeuRecommandations,
  especePath,
  findEnjeu,
  habitatPath,
  objectifAnchor,
  sousObjectifPath,
  usePlanGestion,
} from '../plan-gestion.ts'

// MapLibre is heavy: it loads only for an enjeu with a map
const LazyHabitatMap = lazy(async () => {
  const {HabitatMap} = await import('../components/habitat-map.tsx')
  return {default: HabitatMap}
})

const mapHeight = 'min(65vh, 36rem)'

// A white box on the tinted page
const box = 'fr-p-3w'
const boxStyle = {backgroundColor: fr.colors.decisions.background.default.grey.default}

// The enjeux of the parc, one at a time: what the plan de gestion says of the chosen one
export function EnjeuPage() {
  const parc = useParc()!
  const plan = usePlanGestion()
  const navigate = useNavigate()
  const {carte} = useLoaderData<EnjeuPageData>()
  // The route answers 404 for an enjeu that the plan does not hold
  const enjeu = findEnjeu(plan, useParams().enjeuId)!
  const pictogramme = enjeu.pictogramme === undefined ? undefined : pictogramUrl(enjeu.pictogramme)
  const habitats = enjeuHabitats(plan, enjeu)
  const mappedHabitats = carte ? habitats.filter(habitat => carte.codes.includes(habitat.code)) : []
  const habitatLinks = habitats.map(habitat => ({id: habitat.code, label: habitat.nom, to: habitatPath(parc.id, habitat.code)}))
  const especeLinks = enjeuEspeces(plan, enjeu).map(espece => ({id: espece.id, label: espece.nom, to: especePath(parc.id, espece.id)}))
  const sousObjectifCount = enjeu.objectifs.reduce((count, objectif) => count + objectif.sousObjectifs.length, 0)
  const today = new Date().toISOString().slice(0, 10)
  const actions = enjeuActions(plan, enjeu).map(action => ({
    id: action.id,
    libelle: action.libelle,
    categorie: action.categorie,
    statut: actionStatut(action, today),
    to: actionPath(parc.id, action.id),
  }))

  return (
    <>
      <title>{`${enjeu.libelle} - Explorer les enjeux - ${parc.nom} - Mon Parc Marin`}</title>
      <h1>Enjeux du Parc marin</h1>
      {plan.document !== undefined && (
        <p className='fr-text--sm'>
          {'Source : '}
          <a href={plan.document} target='_blank' rel='noopener noreferrer' title='le plan de gestion du Parc - nouvelle fenêtre'>
            le plan de gestion du Parc
          </a>
        </p>
      )}

      <div className={`${box} fr-mb-6w`} style={boxStyle}>
        <EnjeuFilter
          enjeux={plan.enjeux}
          selectedId={enjeu.id}
          onSelect={id => {
            // The filter stays in view
            void navigate(enjeuPath(parc.id, id), {preventScrollReset: true})
          }}
        />
      </div>

      <section aria-labelledby='enjeu'>
        <h2 id='enjeu' style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          {pictogramme !== undefined && <Pictogram url={pictogramme} size={48} />}
          {enjeu.libelle}
        </h2>

        {carte && (
          <div className={`${box} fr-mb-3w`} style={boxStyle}>
            <Suspense fallback={<div style={{height: mapHeight}} />}>
              <LazyHabitatMap habitats={mappedHabitats} tilesUrl={carte.tilesUrl} perimetre={carte.perimetre} />
            </Suspense>
            <p className='fr-text--xs fr-mt-1w fr-mb-0'>
              Les contours des habitats sont élargis et simplifiés : ils montrent où ils se trouvent, pas
              leur limite exacte. Sources : cartographies des habitats de l'OFB, plan de gestion du parc.
            </p>
          </div>
        )}

        {habitatLinks.length > 0 && (
          <div className={`${box} fr-mb-3w`} style={boxStyle}>
            <h3>Habitats concernés</h3>
            <TagLinks links={habitatLinks} />
          </div>
        )}

        {especeLinks.length > 0 && (
          <div className={`${box} fr-mb-3w`} style={boxStyle}>
            <h3>Espèces concernées</h3>
            <TagLinks links={especeLinks} />
          </div>
        )}

        <Figures
          figures={[
            {label: 'Sous-objectifs', value: sousObjectifCount},
            {label: 'Recommandations', value: enjeuRecommandations(plan, enjeu).length},
          ]}
        />

        <div className='fr-grid-row fr-grid-row--gutters fr-mt-1w'>
          <div className='fr-col-12 fr-col-md-6'>
            <div className={box} style={{...boxStyle, height: '100%'}}>
              <h3>Description</h3>
              {enjeu.description === undefined
                ? <p>Le plan de gestion ne décrit pas encore cet enjeu.</p>
                : <PlanText text={enjeu.description} />}
              {enjeu.synthese !== undefined && (
                <Accordion label='En savoir plus' titleAs='h4'>
                  <PlanText text={enjeu.synthese} />
                </Accordion>
              )}
              {(enjeu.beneficesMer !== undefined || enjeu.beneficesTerritoire !== undefined) && (
                <>
                  <h3 className='fr-mt-4w'>Bénéfices</h3>
                  {enjeu.beneficesMer !== undefined && <Benefices titre='Pour la mer' text={enjeu.beneficesMer} />}
                  {enjeu.beneficesTerritoire !== undefined && <Benefices titre='Pour le territoire' text={enjeu.beneficesTerritoire} />}
                </>
              )}
            </div>
          </div>
          <div className='fr-col-12 fr-col-md-6'>
            <div className={`${box} fr-mb-3w`} style={boxStyle}>
              <h3>Objectifs</h3>
              <ObjectifList
                objectifs={enjeu.objectifs}
                objectifAnchor={objectifAnchor}
                sousObjectifPath={id => sousObjectifPath(parc.id, id)}
              />
            </div>
            <div className={box} style={boxStyle}>
              <h3>Actions du Parc</h3>
              {actions.length === 0
                ? <p className='fr-mb-0'>Aucune action du Parc n'est encore rattachée à cet enjeu.</p>
                : <ActionCards actions={actions} titleAs='h4' />}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
