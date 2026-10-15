import {Button} from '@codegouvfr/react-dsfr/Button'

export function NotFoundPage() {
  return (
    <div className='fr-container fr-py-6w'>
      <title>Page non trouvée - Mon Parc Marin</title>
      <h1>Page non trouvée</h1>
      <p className='fr-text--sm fr-mb-3w'>Erreur 404</p>
      <p className='fr-text--lead'>
        La page que vous cherchez est introuvable. Excusez-nous pour la gêne occasionnée.
      </p>
      <Button linkProps={{to: '/'}}>Page d'accueil</Button>
    </div>
  )
}
