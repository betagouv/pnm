import {Button} from '@codegouvfr/react-dsfr/Button'

export function ErrorPage() {
  return (
    <div className='fr-container fr-py-6w'>
      <title>Erreur inattendue - Mon Parc Marin</title>
      <h1>Erreur inattendue</h1>
      <p className='fr-text--lead'>
        Désolé, le service rencontre un problème. Essayez de rafraîchir la page ou réessayez plus
        tard.
      </p>
      <Button linkProps={{to: '/'}}>Page d'accueil</Button>
    </div>
  )
}
