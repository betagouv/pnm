import {fr} from '@codegouvfr/react-dsfr'

// Holds the place of an image to come, in the 16:9 ratio of the DSFR
export function ImagePlaceholder() {
  return (
    <figure className='fr-content-media fr-m-0'>
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
          color: fr.colors.decisions.text.mention.grey.default,
        }}
      >
        <span className='fr-icon-image-line fr-icon--lg' aria-hidden='true' />
      </div>
      <figcaption className='fr-content-media__caption'>Image à venir</figcaption>
    </figure>
  )
}
